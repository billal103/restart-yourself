# Architecture — Milestone 1

## Folder Structure

```
src/
  assets/              Static images (none committed yet — add as needed)
  components/
    common/            Cross-cutting UI (EmptyState, ConfirmDialog, AnonymousAvatar, SettingsTabs)
    layout/             PublicLayout, AuthLayout, DashboardLayout, AdminLayout, nav/footer/sidebars
    stories/            StoryCard, StoryFeed, CategoryBadge, ReactionBar
    community/          CommentThread
    messaging/          MessageBubble
    recovery/           MoodChart
    admin/              (reserved for admin-specific widgets as they grow)
    forms/              (reserved — form building blocks beyond schema-driven inputs)
    ui/                 Radix-based primitives (button, card, dialog, select, tabs, toast, …)
  pages/
    public/             Landing, About, How It Works, Guidelines, Privacy, Terms, Safety, Contact, 404
    community/           Feed, Explore, Story Details, Category Details, Search, Groups, Group Details, Resources
    auth/                Login, Register, Forgot/Reset Password
    dashboard/           User dashboard + all authenticated member tools
    admin/               Admin console pages
  hooks/                (reserved for shared hooks as Milestone 2/3 add data fetching)
  services/             (reserved — will wrap Supabase calls behind the same interface as lib/mockData)
  lib/
    mockData/            All Milestone 1 mock data, shaped to match the planned Supabase schema
    utils.ts             cn(), date formatting, truncate()
    categoryIcons.ts      Explicit icon map (avoids bundling all of lucide-react)
  contexts/              (reserved)
  stores/                Zustand stores: authStore (mock session), toastStore
  types/                 domain.ts — shared TypeScript types mirroring the future DB schema
  schemas/                Zod schemas for every form (auth, contact, story)
  i18n/                   i18next setup + en/bn locale files (navigation/chrome strings only)
  routes/                 AppRoutes.tsx — the full route tree, lazy-loaded per page
  styles/                 globals.css — design tokens (Tailwind v4 @theme) and base styles

supabase/                 Empty scaffold for Milestone 2 (migrations/, functions/, seed.sql)
tests/
  unit/                   Vitest + React Testing Library
  integration/            (reserved for Milestone 2+)
  e2e/                     Playwright specs
docs/                      This file and the other Milestone 1 docs
```

## Routing Map

All routes are defined in `src/routes/AppRoutes.tsx` using React Router v7, with every page
lazy-loaded (`React.lazy`) and a single `<Suspense>` boundary in `App.tsx`.

| Layout | Routes |
|---|---|
| `PublicLayout` | `/`, `/about`, `/how-it-works`, `/guidelines`, `/privacy`, `/terms`, `/safety`, `/contact`, `/feed`, `/explore`, `/stories/:storyId`, `/categories/:categorySlug`, `/search`, `/groups`, `/groups/:groupId`, `/resources` |
| `AuthLayout` | `/login`, `/register`, `/forgot-password`, `/reset-password` |
| `DashboardLayout` (mock-auth gated) | `/dashboard`, `/dashboard/stories`, `/dashboard/stories/new`, `/dashboard/stories/:storyId/edit`, `/dashboard/saved`, `/dashboard/journal`, `/dashboard/mood`, `/dashboard/goals`, `/dashboard/notifications`, `/dashboard/messages`, `/dashboard/messages/:conversationId`, `/dashboard/groups/:groupId/chat`, `/dashboard/call/:sessionId`, `/dashboard/settings/profile`, `/dashboard/settings/privacy`, `/dashboard/settings/language` |
| `AdminLayout` (mock-role gated) | `/admin`, `/admin/users`, `/admin/stories`, `/admin/comments`, `/admin/reports/messages`, `/admin/reports/calls`, `/admin/categories`, `/admin/communities`, `/admin/professionals`, `/admin/resources`, `/admin/settings`, `/admin/audit-logs` |
| (none) | `*` → 404 |

`DashboardLayout` redirects to `/login` when `useAuthStore().isAuthenticated` is false.
`AdminLayout` redirects to `/login` unless the current user's role is one of
`admin`, `super_admin`, `content_moderator`, `group_moderator`. As of Milestone 2, `isAuthenticated`
and `role` reflect a real Supabase session when one is configured (see below) — these checks are
no longer purely cosmetic once a backend is connected, though real enforcement always lives in
Postgres RLS (`supabase/migrations/`), never only in frontend route guards.

## Backend: Supabase (Milestone 2 + 3)

`src/lib/supabase/`:
- `env.ts` — a zero-dependency `isSupabaseConfigured` flag, checked everywhere so the app can
  decide mock-vs-real without pulling in the Supabase client itself.
- `client.ts` — the actual `@supabase/supabase-js` client. Deliberately never imported from an
  eagerly-loaded module (see the bundle-size note in `docs/PROJECT_PROGRESS.md`) — only from inside
  `src/services/*.ts`, which are themselves dynamically `import()`-ed by every page that uses them.
- `database.types.ts` — hand-written types covering every table in `supabase/migrations/`; replace
  with `supabase gen types typescript` output once a real project exists.

`src/services/` wraps every real Supabase call the frontend makes: `auth.service.ts`,
`profile.service.ts`, `stories.service.ts`, `comments.service.ts`, `reactions.service.ts`,
`social.service.ts` (bookmarks/blocks/reports), `messaging.service.ts`, `groups.service.ts`,
`recovery.service.ts` (journal/mood/goals), `notifications.service.ts`, `professionals.service.ts`,
`calling.service.ts`. Every page that reads or writes one of these domains now follows the same
dual-mode pattern established in Milestone 2: call the real service when `isSupabaseConfigured`,
otherwise keep the original Milestone 1 mock-data behavior — so the app fully works with zero
backend setup, and fully works for real once one is connected. `docs/SUPABASE_SETUP.md` has the
up-to-date table of what's wired vs. what's intentionally still mock-only (the pure story-browsing
pages — Landing, Community Feed, Category Details — stay on mock data; the interactive loop around
them — explore, story details, create/edit/delete, react, comment, bookmark, report — is real).

`src/hooks/useWebRTCCall.ts` holds the real `getUserMedia`/`RTCPeerConnection` logic for voice and
video calls, signaled through the `call_signals` table. `src/components/calling/IncomingCallListener.tsx`
is mounted once in `DashboardLayout` and listens for calls meant for the current user, showing a
modal that requires explicit Accept/Decline. See [REALTIME_AND_CALLING.md](REALTIME_AND_CALLING.md)
for the full architecture, including the STUN-only limitation.

The real schema, RLS policies, and security test suite live in `supabase/migrations/` (18 files)
and `supabase/tests/` — see [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

## Mock Data → Real Services Boundary

Everything in `src/lib/mockData/` is shaped to mirror the tables in
[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md). As of Milestone 3, every interactive feature —
auth, stories (create/edit/delete/publish), reactions, comments, bookmarks, blocks, reports,
private messaging, group chat, journal, mood tracking, recovery goals, notifications, the
professional/resource directory, and calling — is dual-mode: real Supabase when
`isSupabaseConfigured`, the original Milestone 1 mock behavior otherwise. A few purely
read-only browsing pages (Landing, Community Feed, Category Details, Search Results) are
still mock-only by choice, since they add no new wiring pattern beyond what Explore Stories
already demonstrates — see `docs/SUPABASE_SETUP.md` for the exact table.

## State Management

- **Zustand** (`src/stores/`) for small, cross-page client state: the auth session (`authStore` —
  real Supabase session when configured, mock otherwise) and the toast queue (`toastStore`).
  Per-page state (form drafts, filters, local lists built from mock data) stays local with
  `useState`.
- **React Hook Form + Zod** for every form, with schemas centralized in `src/schemas/`.

## Design System

Design tokens live in `src/styles/globals.css` as Tailwind v4 `@theme` variables (colors,
radii, shadows), redefined under `[data-theme="dark"]` for the (currently unused, but wired)
dark mode architecture. Components in `src/components/ui/` follow the shadcn/ui pattern — Radix
primitives + `class-variance-authority` + `cn()` — so they're easy to extend or regenerate.

## Known Limitations

- Without a configured Supabase project, there is no persistence — a page refresh resets all
  in-memory state. With one configured, auth persists via a real session; every other page still
  uses in-memory mock state regardless (see Mock Data → Real Services Boundary above).
- i18n covers navigation, the dashboard/admin sidebars, and the login form in English + Bangla;
  most other page content is still English-only — full coverage across all 46 pages remains future
  work.
- Voice/video calling is real WebRTC when a backend is connected (see
  [REALTIME_AND_CALLING.md](REALTIME_AND_CALLING.md)), with a documented STUN-only limitation; it
  falls back to the Milestone 1 simulated UI in mock mode. Never tested between two live peers in
  this session (no second browser session or live backend available) — implemented, not confirmed.
- Legal pages (Privacy, Terms) are drafts pending legal review (Milestone 4).
- The database schema and RLS policies have been reviewed carefully but not executed against a
  real Postgres instance in this environment (no Docker available) — see `docs/SECURITY.md` for
  the implemented-vs-tested status of every security requirement.

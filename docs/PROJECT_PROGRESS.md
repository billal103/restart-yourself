# Project Progress

## Session: Milestone 4 (in progress) — Genuine backend & calling verification — 2026-11-15

### Completed

- Closed Milestone 3's single biggest caveat — "no migration, RLS policy, or RPC has
  ever been run against a real database" — without Docker, using
  `@electric-sql/pglite` (a real Postgres engine compiled to WASM). `tests/db/run.mjs`
  boots a real Postgres instance, stubs only the minimal `auth`/`storage` schemas
  Supabase provides, applies all 19 real migration files verbatim, creates real
  `authenticated`/`anon` roles, seeds 5 fixture users, and runs 32 access-control
  assertions as those roles (not as the table owner, which is RLS-exempt by default).
  **Result: 32 passed, 0 failed** (`npm run test:db`).
- That run found four real bugs that code review had missed in both Milestone 2 and 3:
  two RLS infinite-recursion bugs (`conversation_members`, `call_participants` —
  policies that queried their own table from inside their own policy), one missing
  enum cast in `respond_to_message_request()`, and a `search_path` bug in
  `issue_guest_token()`/`claim_guest_story()` that dropped the `extensions` schema
  pgcrypto lives in — this last one would have broken identically on a real Supabase
  project, not just in this test harness. Also found and fixed a real product gap:
  community creators weren't automatically members of their own community, so they
  couldn't see or post in their own group chat. All five fixed in
  `supabase/migrations/20260101000019_fix_recursion_and_search_path.sql` — full
  writeup in `docs/DATABASE_SCHEMA.md`.
- Closed the other half of Milestone 3's biggest caveat — "WebRTC calling has never
  connected two real peers" — with `tests/e2e/webrtc-mechanics.spec.ts`: two real
  Chromium browser contexts (fake camera/mic via Playwright launch flags) run the
  actual `useWebRTCCall` negotiation logic (`getUserMedia`, `RTCPeerConnection`,
  offer/answer, ICE exchange with the same pending-candidates queue the app uses) with
  signals relayed directly between the two pages instead of through Supabase Realtime
  (no live project exists in this sandbox). **Result: both peers reach `connected` and
  exchange real audio/video tracks in ~350ms.** Diagnosed along the way that this
  sandbox's outbound UDP likely can't reach Google's public STUN server (confirmed via
  a `curl` timeout check), so the test deliberately runs STUN-less, host-candidate-only
  negotiation — appropriate for two local peers, and orthogonal to what the test is
  actually proving (that the negotiation code itself is correct).
- Updated `docs/SECURITY.md`, `docs/DATABASE_SCHEMA.md`, and
  `docs/REALTIME_AND_CALLING.md` to replace every "Implemented, not yet tested" status
  tied to RLS/RPC/signaling with "Implemented & verified against real Postgres" (or the
  browser-level equivalent for calling), and to precisely scope what remains unverified:
  Supabase's own GoTrue/Realtime/pg_cron infrastructure, and real cross-network calls
  through public STUN/TURN against a live project.
- Added `npm run test:db` to `package.json` so the new harness is discoverable
  alongside `npm test` and `npm run test:e2e`.
- Re-ran the full verification set after all of the above (`npm run test:db`,
  `npx playwright test`, `npx vitest run`, `npx tsc -b`, `npm run build`, `npx oxlint`)
  — all clean, no regressions, bundle chunking unchanged.

### Completed (continued): admin console and moderation tooling wired to real data

- Wired all 8 admin-console pages to real Supabase data through a new
  `src/services/moderation.service.ts`, following the same dual-mode pattern as every
  other service (mock data when `isSupabaseConfigured` is false, real queries/RPCs when
  true): `AdminDashboardPage` (real stats via a new `get_admin_stats()` RPC + a live
  recent-activity feed from `audit_logs`), `StoryModerationPage` (approve/reject calling
  real `stories` updates plus `record_moderation_action`), `CommentModerationPage` (now
  actually queries the `reports` table for open comment reports, joins the real comment
  and marks both the comment removed and the report resolved — the mock version never
  had a real "reported" concept at all), `MessageReportsPage` and `CallReportsPage`
  (both now read and resolve real `communication_reports` rows, split by `target_type`;
  `CallReportsPage` gained a resolve action it never had in Milestone 1), `AuditLogsPage`
  (reads the real `audit_logs` table), `UserManagementPage` (lists real
  `anonymous_profiles` + `user_roles` + the new `user_account_status`, with a management
  dialog to grant/revoke roles and change account status), and `CategoryManagementPage`
  (real create/edit against `categories`, with real per-category story counts).
- Added migration 20 (`20260101000020_account_status_and_admin_stats.sql`): a
  `user_account_status` table (admin-write-only, mirroring how `user_roles` already
  keeps role changes out of reach of the user being changed) backing the
  previously-unbacked "status" column on `UserManagementPage`, plus `get_admin_stats()`
  (one security-definer RPC instead of several client-side count queries that would
  undercount for a non-admin moderator) and `set_user_account_status()`.
- Added the frontend half of suspension enforcement: `authStore.ts` now checks
  `user_account_status` right after a real sign-in or session restore and signs a
  suspended account back out (`rejectIfSuspended()`). Documented clearly in
  `docs/SECURITY.md` that this is *not* the same as server-side enforcement — a real
  production deployment would still want a Supabase Auth Hook, which needs a live
  project this sandbox doesn't have.
- Added a small `src/lib/rbac.ts` (`isAdmin()`/`isModerator()`) so pages can hide
  admin-only controls (role grants, account status, category CRUD) from a
  `content_moderator`/`group_moderator` who can reach the admin console but isn't an
  admin — a UI nicety; the real boundary is still RLS, as `tests/db/run.mjs` now checks
  directly (a `content_moderator` genuinely cannot call `set_user_account_status()` or
  grant roles; a non-moderator genuinely cannot call `get_admin_stats()`).
- Extended `tests/db/run.mjs` with 7 new assertions covering migration 20 (account
  status RLS and RBAC, admin stats RPC access control) — **39 passed, 0 failed**,
  up from 32.
- Added `tests/unit/AdminPages.test.tsx` (10 new Testing Library tests, Vitest total now
  13): renders all 8 admin pages directly (bypassing `AdminLayout`'s route guard, since
  that guard is a one-line role check already covered by reading it) with a real
  `super_admin` or `content_moderator` user injected into `authStore`, in mock mode.
  Confirms each page renders without crashing and that interactions actually work —
  approving a story removes it from the pending queue, removing a reported comment
  clears it from the list, resolving a report flips its badge, a non-admin moderator
  gets disabled Manage/New-Category buttons while an admin gets working ones that open
  the real dialogs. This is something `tsc`/`oxlint` cannot check — this is the
  equivalent of actually opening the page, which Milestone 3's equivalent claim rested
  only on a Playwright pass through the mock-data *user-facing* flows, not the admin
  console specifically.
- Re-ran `npx tsc -b`, `npx oxlint`, `npm run build`, `npm run test:db`,
  `npx vitest run`, and `npx playwright test` after all of the above — all clean.
  (`npx oxlint` briefly flagged 6 new `react/set-state-in-effect` warnings on the admin
  pages; fixed by wrapping each page's load call in an inline async IIFE inside the
  effect, matching the pattern already used by `AdminDashboardPage`/`AuditLogsPage`.)

### Database Changes

2 new migrations (19, 20) on top of Milestone 3's 18 — see `docs/DATABASE_SCHEMA.md`
for the full bug-by-bug breakdown of 19 and the account-status/admin-stats design of 20.

### Completed (continued): real account deletion/export, 3 legal pages, and the 7 user journeys

- Implemented the "Delete My Account" and "Export My Data" buttons on
  `PrivacySettingsPage` for real — both existed since Milestone 1 as no-op buttons.
  Added migration 21 (`request_account_deletion()`, a security-definer RPC that deletes
  the caller's `auth.users` row and lets the schema's existing cascade/set-null FK
  design do the rest) and `profileService.exportMyData()`/`deleteOwnAccount()`.
  `PrivacySettingsPage` now shows a real confirm dialog before deleting, triggers a real
  JSON download for export, and signs out + redirects home after deletion.
- Added the three legal pages `PrivacyPolicyPage` had been promising since Milestone 1
  ("see Milestone 4 deliverables"): `DataRetentionPolicyPage` (/data-retention),
  `AccountDeletionPolicyPage` (/account-deletion), `CookiePolicyPage` (/cookies) —
  linked from the footer and from `PrivacySettingsPage`'s data section. Each documents
  the actual implemented mechanism (cascade/set-null design, pg_cron signal cleanup,
  localStorage-not-cookies session storage), not generic template text.
- Added `tests/db/run.mjs` assertions for the new RPC: a throwaway user creates a story
  and a journal entry, deletes their own account, and both are confirmed gone while a
  `account_self_deleted` audit log entry survives with its actor anonymized — **41
  passed, 0 failed**, up from 39.
- **Wrote real Playwright tests for all 7 of the spec's critical user journeys**
  (`tests/e2e/user-journeys.spec.ts`): anonymous browsing (explore → story → react →
  comment), guest story publishing, registration, personal recovery tools (journal,
  mood, goals), private messaging (accept a request, send a message), group chat (join,
  post), and calling (start → connect → end). Each test drives the real UI in a real
  browser against the mock-data path — the same path a demo visitor without a backend
  actually uses. Doing this surfaced a real, previously-invisible bug: posting a comment
  in mock/demo mode silently cleared the textarea and never actually added the comment
  anywhere — a genuine gap from Milestone 1 that no code review had caught, since the
  mock branch for every *other* interactive page already updates local state but this
  one didn't. Fixed in `src/pages/community/StoryDetailsPage.tsx`. All 7 journeys now
  **pass**, alongside the existing landing and WebRTC-mechanics tests (9/9 total).
- Re-ran the full verification set again after all of the above — `npx tsc -b`,
  `npx oxlint`, `npm run build`, `npm run test:db`, `npx vitest run`,
  `npx playwright test` — all clean.

### Completed (continued): performance review

Reviewed the built output and source for real, checkable performance issues rather than
assuming the architecture is fine because it was designed carefully:

- **Route-level code splitting**: confirmed every page in `src/routes/AppRoutes.tsx` is
  wrapped in `lazy()` — already true since Milestone 1, re-verified still true here.
- **Bundle sizes**: `npm run build` produces no Vite chunk-size warnings (default
  threshold 500 KB per chunk); the two largest chunks are the shared `index` entry
  (~441 KB) and `MoodTrackerPage` (~360 KB, Recharts correctly isolated to its own lazy
  chunk rather than bundled everywhere). `@supabase/supabase-js` stays out of the
  eagerly-loaded bundle — confirmed via the dual-mode `import()` pattern used
  throughout every service file.
- **Found and fixed a real issue**: all 3 `<img>` tags in the codebase (all on
  `LandingPage.tsx` — no other page renders a raw image) had no loading strategy at
  all. The hero banner (1920×1280, likely this page's Largest Contentful Paint element)
  now has `fetchPriority="high"`; the below-the-fold "community" photo and the 3
  testimonial photos now have `loading="lazy"`, so the browser defers downloading them
  until they're about to scroll into view instead of competing with the hero image for
  bandwidth on first paint.
- Checked the actual image file sizes/dimensions (hero: 327 KB at 1920×1280; others
  36–174 KB) — reasonable for JPEG at those dimensions, not egregiously oversized.
  Converting them to WebP/AVIF would likely still shave meaningful size, but that needs
  image-processing tooling (e.g. `sharp`) this sandbox doesn't have installed;
  flagged here as a real future optimization rather than silently skipped or faked.
- Swept `src/` for leftover `console.log`/`console.debug` calls — none found.

### Known Issues / Incomplete Items

- **Supabase's own hosted infrastructure is still unverified in this sandbox.**
  `tests/db/run.mjs` stubs `auth.uid()` rather than running GoTrue itself, so GoTrue's
  actual HTTP/JWT issuing, the Realtime websocket transport, and pg_cron's actual
  execution (skipped entirely in the PGlite harness — it's a background worker
  incompatible with PGlite's single-process WASM model) remain "implemented and
  reviewed," not executed. This is a much smaller remaining gap than before, but it is
  real, and the honest next step is running the same suites against a real Supabase
  project once one exists.
- **No real cross-network call has been placed.** The WebRTC test proves the
  negotiation code is correct between two local browser contexts with signals relayed
  directly; it does not prove a call works across the public internet, through real
  NAT, with Supabase Realtime as the signaling transport and real STUN/TURN in the
  path. That is still open.
- **`UserManagementPage` cannot show real email addresses.** The anon/authenticated
  client only has access to the `public` schema; `auth.users` (which holds email) is
  never exposed to it by design, and there's no live Supabase project here to add a
  service-role Edge Function that could expose it safely. Every real-mode row shows
  `email: null` — documented in `src/services/moderation.service.ts` and
  `docs/SECURITY.md` rather than faked.
- **Suspension is recorded and RLS-protected, but not fully enforced.** See the new
  section in `docs/SECURITY.md` — the frontend signs a suspended user out on their next
  sign-in/session-restore check, but Postgres itself has no mechanism to kill an
  already-open session mid-flight; that needs a Supabase Auth Hook on a live project.
### Completed (continued): deployment preparation

- Added `.github/workflows/ci.yml`: a `test` job (typecheck, lint, Vitest, the real
  Postgres suite, build, full Playwright suite) on every push/PR, plus a `deploy` job
  gated by `needs: test` and `main`-only pushes that publishes `dist/` to Cloudflare
  Pages via `cloudflare/pages-action`. Nothing has been deployed or even dry-run from
  this sandbox — there's no GitHub remote and no Cloudflare account reachable here —
  but the workflow is syntactically complete and will work once the repository owner
  adds the Cloudflare secrets/variables it reads (documented in the new
  `docs/DEPLOYMENT.md`).
- Added `public/_redirects` (`/* /index.html 200`) — required for a client-side-routed
  SPA on Cloudflare Pages; without it, directly loading or refreshing any
  `/dashboard/...` route 404s.
- Added `docs/DEPLOYMENT.md` and refreshed the stale parts of
  `docs/SUPABASE_SETUP.md` (its "what's wired up" table and Docker caveat still read
  like Milestone 2/3, before this session's PGlite testing and admin-console wiring).

### Known Issues / Incomplete Items (deployment)

- **Nothing has actually been deployed.** This sandbox has no GitHub remote and no
  Cloudflare/Supabase cloud credentials — the CI/CD pipeline and Cloudflare Pages setup
  are real and ready, not aspirational, but they have never executed against real cloud
  infrastructure. The repository owner needs to push to GitHub and complete the
  one-time setup in `docs/DEPLOYMENT.md` before the `deploy` job can succeed.
- **Schema deployment (`supabase db push`) is deliberately not automated** in CI —
  applying migrations to a production database on every merge, without a human
  reviewing the migration first, is a bigger risk than the convenience is worth. Stays
  a manual step.

### Next Steps

1. Final documentation pass per spec section 4.9 (admin user guide, security
   checklist, test report, known limitations, roadmap).
2. Push to GitHub and complete the one-time Cloudflare Pages setup in
   `docs/DEPLOYMENT.md`, when ready to actually go live.

---

## Session: Milestone 3 — Complete Functionality & Real-Time Communication — 2026-11-15

### Completed

- Added 5 more SQL migrations (15–18, plus a second file at 18) on top of Milestone 2's 13:
  notification triggers wired to new message requests/messages/comments/replies/reactions/group
  messages (and those tables added to the `supabase_realtime` publication), a generic rate-limiting
  trigger applied to messages/comments/group messages/reports/conversations, a fix to
  `call_sessions` RLS so the callee — not just the caller — can see an incoming call, and explicit
  second foreign keys straight to `anonymous_profiles(user_id)` so PostgREST can embed
  author/profile data in list queries.
- Wrote 10 new service modules (`comments`, `reactions`, `social` [bookmarks/blocks/reports],
  `messaging`, `groups`, `recovery`, `notifications`, `professionals`, `calling`, plus expanding
  `stories` and `profile`), each following Milestone 2's dual-mode pattern.
- Expanded `src/lib/supabase/database.types.ts` from 7 hand-typed tables to all ~30 in the schema —
  needed because every new service now queries most of them, and PostgREST embedding requires each
  table's `Relationships` array to be accurate or `tsc` reports the whole query as `never`.
- Rewired essentially every interactive page to the real backend in dual-mode: story
  create/edit/delete/publish (with a guest recovery-token dialog shown exactly once), explore/story
  details/my-stories/saved-stories, reactions, nested comments, bookmarks, block/unblock, content
  and communication reports, private messaging (with a live Postgres Changes subscription),
  message-request accept/decline, group browsing/join/leave, live group chat, private journal, mood
  tracker, recovery goals with milestones, the notification center (with live updates and real
  preferences), and the professional/resource directory. Deliberately left as mock-only: Landing,
  Community Feed, Category Details, and Search — pure browsing pages that would only repeat the
  Explore Stories wiring pattern without adding anything new.
- Built real WebRTC voice/video calling: `src/hooks/useWebRTCCall.ts` (`getUserMedia` +
  `RTCPeerConnection`, offer/answer/ICE exchange via the `call_signals` table, with ICE-candidate
  queuing for the race condition where a candidate arrives before the remote description is set)
  and `src/components/calling/IncomingCallListener.tsx` (mounted once in `DashboardLayout`,
  requires explicit Accept/Decline before a call ever connects — no path skips this). STUN-only by
  design, documented as a real limitation rather than silently adding a paid TURN dependency.
- Expanded i18n beyond Milestone 1's nav-only coverage: the public navbar, the dashboard sidebar,
  the admin sidebar, and the full login form now translate correctly between English and Bangla
  (verified visually — Bangla renders correctly across the dashboard sidebar in a screenshot).
  Most other page content remains English-only; this is a partial, honestly-scoped pass, not full
  coverage of all 46 pages.
- Found and fixed two real mistakes before they shipped, both documented in
  `docs/DATABASE_SCHEMA.md`: (1) the `call_sessions` RLS policy that made incoming calls invisible
  to the person being called, caught while reasoning through what the incoming-call listener would
  need to query; (2) PostgREST embedding across tables that only shared an indirect reference
  through `auth.users`, caught immediately by `tsc` reporting `SelectQueryError` types.
- Added `authStore.initialize()` subscribing to `onAuthStateChange`, so a session change this store
  didn't cause itself (token refresh, expiry, sign-out in another tab) stays in sync — a real gap
  in Milestone 2's auth wiring, fixed here.
- Caught and fixed a second bundle-size regression the same way as Milestone 2's: verified via
  `npm run build` that the main chunk stayed under the 500 KB warning threshold (419 KB → 440 KB,
  a modest, expected increase from `IncomingCallListener` and expanded store code) after all this
  wiring, rather than assuming it was fine.
- Verified the entire mock-mode path end-to-end with Playwright against the running dev server:
  guest login, create and save a story draft, explore stories, community groups, support resources,
  private journal entry creation, mood logging, recovery goals, conversations list, notifications,
  privacy settings, group chat message send, and private chat message send — all with zero console
  errors. This confirms the dual-mode UI logic is sound; it does not confirm the real-Supabase code
  path (see Known Issues).
- `npx tsc -b`, `npm run build`, `npx oxlint`, and `npx vitest run` all pass clean throughout, with
  no new lint warnings beyond the pre-existing non-blocking ones from Milestone 1.

### Database Changes

5 new migration files (15–18) on top of Milestone 2's 13 — see `docs/DATABASE_SCHEMA.md` for the
full list and the two bugs found and fixed while building on top of them.

### Known Issues / Incomplete Items — read before trusting this as "done"

- **Still no migration, RLS policy, or RPC has been run against a real database.** Same root cause
  as Milestone 2 (no Docker in this sandbox). The two bugs found this session (call visibility,
  PostgREST embedding) were caught by careful reasoning and by `tsc`, not by a database actually
  rejecting a query — which is exactly the kind of thing `supabase test db` exists to catch
  automatically. Treat every "Implemented, not yet tested" row in `docs/SECURITY.md` as genuinely
  unverified against a live backend.
- **WebRTC calling has never connected two real peers.** The negotiation code is real (no mocked
  `RTCPeerConnection`), but this session had neither a live Supabase project nor two browser
  sessions to actually place and answer a call. This is the single largest "implemented, not
  tested" item in the whole project.
- **i18n coverage is partial by design, not accidental.** Translating all 46 pages' full content
  into Bangla is a much larger task than fit in this session alongside the backend wiring above;
  navigation and the login form prove the mechanism works, and extending it page-by-page is
  straightforward follow-up work, not a redesign.
- Notification triggers fire for the events the spec explicitly lists (message requests, messages,
  comments, replies, reactions, group discussions) but not for call requests or recovery reminders
  — a call request only matters while the recipient is online (better handled by the live incoming-
  call listener than a stored notification), and recovery reminders are scheduled, not event-driven,
  so they need a different mechanism (e.g. a scheduled Edge Function) not built here.
- `discussions`/`discussion_comments` (longer-form community forum threads, distinct from live
  group chat) have full schema and RLS from Milestone 2 but still no frontend page at all — the
  spec's Milestone 1 page list doesn't include one, so there's nothing to wire yet.
- Rate limiting thresholds (e.g. 20 messages/minute) were picked as reasonable defaults, not tuned
  against any real usage data — worth revisiting once real traffic exists.

### Next Steps

1. Get Docker (or a linked Supabase Cloud project) and actually run
   `supabase test db` — this is the single highest-value next step, since it would convert most of
   `docs/SECURITY.md`'s "Implemented, not yet tested" rows to genuinely verified, and would likely
   surface more issues like the two already found.
2. With a live backend, open two browser sessions and confirm a voice and a video call actually
   connect end-to-end.
3. Await explicit approval before starting **Milestone 4: Administration, Security Testing, and
   Deployment**.

---

## Session: Milestone 2 — Database, Backend, Authentication, Security — 2026-11-14

### Completed

- Initialized the Supabase project locally (`supabase init`), tuned `config.toml`
  (site URL for Vite's dev port, anonymous sign-ins enabled for guest access, minimum
  password length raised to 8 to match the frontend's Zod schema).
- Wrote 14 ordered SQL migrations in `supabase/migrations/` covering every table group
  from the spec — user management, stories, community interactions, messaging, calling,
  communities/groups, personal recovery, notifications, moderation, professional
  resources, storage buckets, guest publish tokens, and a pg_cron cleanup job — each with
  RLS enabled and explicit policies (no table left at a silent default). Full table list
  and the handful of deliberate table-merging decisions (and why) are in
  `docs/DATABASE_SCHEMA.md`.
- Implemented the anonymous identity system for real: a `handle_new_user()` trigger
  creates an `anonymous_profiles` row (generated display name + avatar color) for every
  new `auth.users` row, registered or guest, completely separate from the auth identity.
  Confirmed no table or policy ever selects email/phone alongside public content.
- Implemented the guest publishing token system as `SECURITY DEFINER` RPCs
  (`issue_guest_token`, `claim_guest_story`) that store only a SHA-256 hash and return
  the raw token exactly once — schema and functions are complete; no page calls them yet.
- Implemented storage buckets (`avatars`, `story-media`, `community-images`,
  `journal-attachments` private, `professional-documents` private) with file-size limits,
  MIME-type allowlists, and path-based ownership RLS on every bucket.
- Wrote a pgTAP security test suite (`supabase/tests/rls_privacy.sql`) covering the
  highest-stakes guarantees: private journals are invisible even to an admin, a blocked
  user cannot start a new conversation with the blocker (and can't see the block either),
  and guest-token story claims fail with a wrong token.
- Wired real Supabase Auth into the frontend end-to-end, dual-mode: `src/stores/authStore.ts`
  calls real `auth.service.ts` functions when `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`
  are set, and transparently falls back to the original Milestone 1 mock behavior when
  they're not — so the app still runs with zero setup. Updated Login, Register (with a
  "check your email" state for when email confirmation is required), Forgot Password, and
  Reset Password pages to call real auth and show real errors via toast. Added the logout
  button the app was missing (Profile Settings page) — necessary now that a real session
  can actually need signing out of.
- Wrote `src/services/stories.service.ts` and `profile.service.ts` as the "Backend
  Services" deliverable; not yet wired into the story-browsing pages (intentional —
  Milestone 3 is "connect all frontend pages to the backend", and this keeps the M1 demo
  fully working in the meantime). Auth is the one vertical slice fully connected end-to-end
  as proof the stack works.
- Caught and fixed a real bundle-size regression: importing `@supabase/supabase-js`
  eagerly from `authStore.ts` (loaded by the root `App.tsx`) pushed the main JS chunk from
  419 KB to 636 KB for every visitor, including ones on mock mode who never touch auth
  services. Fixed by splitting the "is Supabase configured" check into a zero-dependency
  module (`src/lib/supabase/env.ts`) and dynamically `import()`-ing the actual auth
  service only inside the store's async methods — confirmed via a before/after build that
  the main chunk is back to 419 KB and `@supabase/supabase-js` now loads as its own 216 KB
  chunk, fetched only when actually needed.
- Verified with Playwright against the running dev server (mock mode, no `.env.local`):
  guest login → dashboard flow, register page render, and the dashboard route guard
  redirecting an unauthenticated fresh page load to `/login` — all with zero console
  errors.
- `npx tsc -b`, `npm run build`, `npx oxlint`, and `npx vitest run` all pass clean (same
  pre-existing non-blocking lint warnings as Milestone 1, no new ones).

### Database Changes

First real schema. See `docs/DATABASE_SCHEMA.md` for the full table list and
`supabase/migrations/` for the SQL itself (14 files). Seed data mirroring the Milestone 1
mock categories/tags/resources/communities is in `supabase/seed.sql`.

### Dependencies Added

`@supabase/supabase-js` (runtime), `supabase` CLI (dev dependency).

### Known Issues / Incomplete Items — read before trusting this as "done"

- **No migration or RLS policy in this session was run against a real database.** This
  sandbox had no Docker and no local Postgres, so `supabase start` / `supabase test db`
  could not be executed. Every file was written carefully and reviewed, but "implemented"
  and "tested" are different things here — see the status column in `docs/SECURITY.md`.
  Running the pgTAP suite the first time Docker or a real Supabase project is available is
  the actual verification step, not optional polish.
- Only the Auth vertical slice is wired to real Supabase calls. Every other page
  (stories, messaging, groups, calls, journal, moderation, admin) still reads/writes the
  Milestone 1 mock data layer, even when a real backend is connected. That full wiring is
  explicitly Milestone 3 scope per the spec's own milestone split, not an oversight here.
- `guest_publish_tokens` and the `issue_guest_token`/`claim_guest_story` RPCs have no UI
  entry point yet — there's no "here's your recovery code" screen or "recover with a
  token" form. Schema-ready, not user-facing yet.
- No triggers currently call `notify_user()` automatically (e.g. on a new comment or
  reaction) — the notification-writing primitive exists but nothing fires it yet. Likely
  Milestone 3 work alongside the rest of the page-wiring pass.
- `respond_to_message_request`, `send_message`, `start_call`, and friends are RPCs with no
  frontend caller yet (`PrivateChatPage`/`CallInterfacePage` still use local mock state).

### Next Steps

1. Get a real test run: either enable Docker and run `supabase start && supabase test db`,
   or create a free Supabase Cloud project and `supabase db push` — see
   `docs/SUPABASE_SETUP.md`. Either way, confirm the pgTAP suite actually passes before
   treating the RLS design as verified rather than just reviewed.
2. Await explicit approval before starting **Milestone 3: Complete Functionality and
   Real-Time Communication** (connecting every remaining page to the backend built here).

---

## Session: Milestone 1 Kickoff — 2026-11-14

### Completed

- Scaffolded Vite + React 19 + TypeScript (strict) project; git initialized.
- Installed and configured: Tailwind CSS v4 (CSS-first `@theme` tokens), Radix UI primitives,
  React Router v7, React Hook Form + Zod, Zustand, i18next (en/bn), Recharts, Vitest + React
  Testing Library, Playwright.
- Built the design system: color tokens (indigo/lavender/warm white per spec), typography
  (Inter + Noto Sans Bengali), card/shadow/radius tokens, dark-mode CSS variable architecture
  (wired, not yet toggled anywhere in UI).
- Built ~20 reusable UI primitives in `src/components/ui/` (button, card, badge, input, textarea,
  label, select, tabs, avatar, checkbox, switch, separator, progress, tooltip, dropdown-menu,
  dialog, toast, skeleton).
- Built layout shells: `PublicLayout` (navbar + footer), `AuthLayout`, `DashboardLayout` (sidebar,
  mobile drawer, mock-auth gated), `AdminLayout` (sidebar, mobile drawer, mock-role gated).
- Built the full mock data layer (`src/lib/mockData/`): categories, tags, anonymous author
  generator, stories, comments, conversations/messages, groups/group messages, journal entries,
  mood entries, recovery goals, professionals, resources, notifications, admin stats/audit logs —
  all shaped to mirror the planned Supabase schema (see `docs/DATABASE_SCHEMA.md`).
- Built all 46 pages across public, community, auth, dashboard, and admin sections, wired into a
  single lazy-loaded route tree (`src/routes/AppRoutes.tsx`).
- Implemented every form with React Hook Form + Zod: contact, login, register, forgot/reset
  password, story editor (title/category/tags/content/content-warning/anonymity toggle/guidelines
  agreement/preview/draft/publish), journal entry, recovery goal creation.
- Implemented UI-level versions of the privacy/safety behaviors called out in the brief: message
  requests must be accepted before a conversation is "active," calls require an explicit accept
  step, block/report actions exist on stories/comments/conversations/groups, content warnings can
  gate a story's visible content.
- Wrote 3 passing Vitest unit/component tests (`npm run test`) and one Playwright e2e spec;
  both suites confirmed passing (`npx playwright test` → 1 passed).
- Visually verified in a real headless Chromium browser (landing page desktop + mobile, explore
  page desktop) via a throwaway Playwright script — no console errors, layout matches the design
  intent (hero, story cards with reactions/tags/content-warning badges, mobile hamburger nav and
  stacked hero all render correctly).
- `npm run build` (tsc -b + vite build) succeeds with no errors and no bundle-size warnings.
- `npx oxlint` reports only non-blocking warnings (React Compiler incompatibility notices for
  react-hook-form/zustand setters, and two `only-export-components` fast-refresh notices in
  `button.tsx`/`badge.tsx` — standard for the shadcn/ui cva pattern).

### Database Changes

None — no database exists yet. Mock data only.

### Dependencies Added

See `package.json`. Notable additions beyond the brief's list: `@hookform/resolvers` (zod
integration for react-hook-form), `class-variance-authority` + `tailwind-merge` + `clsx` (needed
for the shadcn/ui-style component pattern), `@testing-library/*` + `jsdom` (Vitest component
testing), `@types/node` (path aliasing in `vite.config.ts`).

### Known Issues / Incomplete Items

- Visual verification so far covers only the landing page (desktop/mobile) and explore page
  (desktop) via an automated screenshot script. The other 44 pages, Radix dialog/select/dropdown
  focus trapping, and the mood calendar's `color-mix()` CSS have not been individually
  screenshotted — worth a fuller manual pass, especially on real mobile devices.
- i18n only covers navigation/chrome strings (`src/i18n/locales/{en,bn}/common.json`) — most page
  content is English-only. Full translation is explicitly a Milestone 3 deliverable per the brief.
- `StoryEditorPage`'s "Preview" mode re-reads live form state but does not validate before
  switching to preview — acceptable for a mock-data prototype, worth tightening once this hits a
  real submit flow in Milestone 3.
- No dark mode toggle exists anywhere in the UI yet, even though the CSS variables are wired
  (`:root[data-theme="dark"]` in `globals.css`). Spec marks this "optional" for Milestone 1.

### Next Steps

1. Manual/visual QA pass of all 46 pages at mobile, tablet, and desktop widths.
2. Confirm the Playwright e2e spec passes once the browser binary finishes installing.
3. Await explicit approval before starting **Milestone 2: Database, Backend, Authentication, and
   Security** (per Rule 1 — milestone-based development, no auto-advance).

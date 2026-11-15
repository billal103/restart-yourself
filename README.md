# Restart Yourself

A global, anonymous-first emotional support and personal recovery platform.

> **Your Story Matters. Your Journey Isn't Over.**

This repository implements **Milestones 1–3** and is in progress on **Milestone 4**: the full
frontend, a real Supabase backend (database, RLS, auth), and the interactive feature set
(stories, messaging, calling, group chat, recovery tools, notifications) wired end-to-end —
and now genuinely tested against a real Postgres engine and real browser-level WebRTC, not
just reviewed. The app runs fully on mock data with zero setup; point it at a real Supabase
project (see below) to switch on the real backend.

## Tech Stack

- **Frontend:** React 19, Vite, TypeScript (strict), Tailwind CSS v4, Radix UI primitives
  (shadcn/ui-style components), Lucide icons, React Router, React Hook Form + Zod, Zustand,
  i18next (English + Bangla), Recharts.
- **Backend:** Supabase — PostgreSQL, Auth (email/password + anonymous/guest), Realtime,
  Storage, Row Level Security. See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).
- **Real-time & calling:** Supabase Realtime (Postgres Changes) for messaging/notifications;
  real WebRTC (`getUserMedia` + `RTCPeerConnection`) for voice/video calls, signaled through
  the database. See [docs/REALTIME_AND_CALLING.md](docs/REALTIME_AND_CALLING.md).
- **Testing:** Vitest + React Testing Library (unit/component), Playwright (end-to-end,
  including real browser-level WebRTC negotiation), a real Postgres engine via
  `@electric-sql/pglite` for executed RLS/RPC testing without Docker (`npm run test:db`), plus
  a pgTAP suite (`supabase/tests/`) for when a real Supabase/Docker stack is available.
- **Deployment:** GitHub Actions CI (typecheck, lint, unit + real-Postgres + e2e tests, build)
  on every push/PR, with a gated deploy job to Cloudflare Pages (frontend) once repository
  secrets are set; Supabase (backend). See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — nothing
  has actually been deployed from this environment (no cloud credentials here).

## Getting Started (Windows / PowerShell)

```powershell
# Install dependencies
npm install

# Start the dev server (http://localhost:5173) — works with no setup, on mock data
npm run dev

# Type-check and build for production
npm run build

# Run unit tests
npm run test

# Run end-to-end tests (requires: npx playwright install chromium, once)
npm run test:e2e

# Run the real-Postgres RLS/RPC test suite (no Docker needed)
npm run test:db

# Lint
npm run lint
```

To connect a real backend instead of mock data, see
[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) — copy `.env.example` to `.env.local`
and fill in your Supabase project's URL and anon key.

## Project Structure

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full folder layout and routing map.

## Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — folder structure, routing, component map
- [PROJECT_PROGRESS.md](docs/PROJECT_PROGRESS.md) — milestone status, completed/pending work
- [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) — the implemented schema and RLS design
- [SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) — how to connect a real backend, and what's
  wired vs. still mock-only
- [REALTIME_AND_CALLING.md](docs/REALTIME_AND_CALLING.md) — messaging and WebRTC calling
  architecture, including the STUN/TURN limitation
- [SECURITY.md](docs/SECURITY.md) — security and privacy commitments, with honest
  implemented-vs-tested status for each one
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) — CI/CD pipeline and how to enable real Cloudflare
  Pages deployment
- [IMAGE_CREDITS.md](docs/IMAGE_CREDITS.md) — photography sources

## Milestone Status

- ✅ **Milestone 1** — Product Design, UI/UX, Frontend
- ✅ **Milestone 2** — Database, Backend, Authentication, Security
- ✅ **Milestone 3** — Complete Functionality & Real-Time Communication (stories, reactions,
  comments, bookmarks, blocking, reporting, private messaging, group chat, WebRTC voice/video
  calling, notifications, personal recovery tools, professional directory, and partial
  English/Bangla translation all wired to the real backend in dual-mode — see Security and
  Database docs for the honest implemented-vs-tested status of each)
- 🔄 **Milestone 4 (in progress)** — Administration, Security Testing, Deployment. The backend
  (all 21 migrations, RLS, and RPCs) has now been genuinely executed against a real Postgres
  engine, real browser-level WebRTC negotiation has been verified, the admin console (story/
  comment moderation, message/call reports, audit logs, user role & account-status management,
  category management) is wired to real data and RBAC, account deletion/export are real (not
  no-op buttons), all 3 previously-promised legal pages exist, and all 7 of the spec's critical
  user journeys are covered by real Playwright tests — see [docs/SECURITY.md](docs/SECURITY.md)
  and [docs/PROJECT_PROGRESS.md](docs/PROJECT_PROGRESS.md) for the full writeup. Performance
  review and deployment prep remain.

## Important Notes

- With no `.env.local`, the app is a **frontend prototype**: every page runs on local mock
  data and in-memory state, same as Milestone 1. With a real Supabase project connected,
  nearly every interactive feature — auth, stories, reactions, comments, bookmarks, blocking,
  reporting, private messaging, group chat, calling, journal, mood tracking, recovery goals,
  and notifications — is real and persisted. A few purely read-only browsing pages (Landing,
  Community Feed, Category Details, Search) remain mock-only by choice.
- **The SQL/RLS/RPC layer has now been genuinely executed**, not just reviewed — against a real
  Postgres engine (`@electric-sql/pglite`, no Docker needed) with 41 passing access-control
  assertions, which found and fixed 4 real bugs (see [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)).
  Real browser-level WebRTC negotiation (`getUserMedia`/`RTCPeerConnection`/ICE) is also verified
  via Playwright, the admin console's 8 pages are covered by 10 Testing Library tests
  (`tests/unit/AdminPages.test.tsx`), and all 7 of the spec's critical user journeys are covered
  by real Playwright tests (`tests/e2e/user-journeys.spec.ts`) that drive the actual UI — writing
  those caught a real bug where posting a comment in mock/demo mode silently did nothing. A
  GitHub Actions CI pipeline runs this entire suite on every push/PR, with a gated Cloudflare
  Pages deploy job ready once repository secrets are added (see
  [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)) — nothing has actually been deployed from this
  environment. What's still unverified in this sandbox: Supabase's own hosted GoTrue/Realtime/
  pg_cron infrastructure, true server-side enforcement of account suspension (recorded and
  RLS-protected, but not yet backed by a Supabase Auth Hook), and a real cross-network call
  through a live project's STUN/TURN — see [docs/SECURITY.md](docs/SECURITY.md) for the itemized,
  honest status of every requirement.
- This platform is a peer support community, **not** a crisis service, emergency responder, or
  substitute for professional mental healthcare. See the in-app Safety & Crisis Support page.

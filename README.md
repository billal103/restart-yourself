# Restart Yourself

A global, anonymous-first emotional support and personal recovery platform.

> **Your Story Matters. Your Journey Isn't Over.**

This repository implements **all four milestones**: the full frontend, a real Supabase
backend (database, RLS, auth), the interactive feature set (stories, messaging, calling,
group chat, recovery tools, notifications) wired end-to-end, a real admin/moderation
console, real account deletion/export, and a CI/CD pipeline — genuinely tested against a
real Postgres engine, real browser-level WebRTC, and real Playwright journeys through the
UI, not just reviewed. The app runs fully on mock data with zero setup; point it at a real
Supabase project (see below) to switch on the real backend. See
[docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) for exactly what "complete" does and
doesn't mean here, and [docs/ROADMAP.md](docs/ROADMAP.md) for what's next.

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
- [ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) — how to use the `/admin` console, role by role
- [SECURITY_CHECKLIST.md](docs/SECURITY_CHECKLIST.md) — scannable pass/fail view of every
  non-negotiable security requirement
- [TEST_REPORT.md](docs/TEST_REPORT.md) — current results and exact coverage of every test
  suite
- [KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) — every honest gap, consolidated in one
  place
- [ROADMAP.md](docs/ROADMAP.md) — prioritized next steps
- [IMAGE_CREDITS.md](docs/IMAGE_CREDITS.md) — photography sources

## Milestone Status

- ✅ **Milestone 1** — Product Design, UI/UX, Frontend
- ✅ **Milestone 2** — Database, Backend, Authentication, Security
- ✅ **Milestone 3** — Complete Functionality & Real-Time Communication (stories, reactions,
  comments, bookmarks, blocking, reporting, private messaging, group chat, WebRTC voice/video
  calling, notifications, personal recovery tools, professional directory, and partial
  English/Bangla translation all wired to the real backend in dual-mode — see Security and
  Database docs for the honest implemented-vs-tested status of each)
- ✅ **Milestone 4** — Administration, Security Testing, Deployment. The backend (all 21
  migrations, RLS, and RPCs) has been genuinely executed against a real Postgres engine (41
  passing assertions), real browser-level WebRTC negotiation has been verified, the admin
  console (story/comment moderation, message/call reports, audit logs, user role &
  account-status management, category management) is wired to real data and RBAC, account
  deletion/export are real (not no-op buttons), all 3 previously-promised legal pages exist,
  all 7 of the spec's critical user journeys are covered by real Playwright tests, a
  performance review found and fixed real image-loading issues, and a CI/CD pipeline is in
  place. "Complete" here means every planned Milestone 4 deliverable has real, working,
  tested code behind it — not that every known limitation is closed; see
  [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) for the honest remaining gaps (mainly:
  nothing has been deployed to live infrastructure yet, since this sandbox has no cloud
  credentials) and [docs/ROADMAP.md](docs/ROADMAP.md) for what's next.

## Important Notes

- With no `.env.local`, the app is a **frontend prototype**: every page runs on local mock
  data and in-memory state, same as Milestone 1. With a real Supabase project connected,
  nearly every interactive feature — auth, stories, reactions, comments, bookmarks, blocking,
  reporting, private messaging, group chat, calling, journal, mood tracking, recovery goals,
  and notifications — is real and persisted. A few purely read-only browsing pages (Landing,
  Community Feed, Category Details, Search) remain mock-only by choice.
- **The SQL/RLS/RPC layer has been genuinely executed**, not just reviewed — against a real
  Postgres engine (`@electric-sql/pglite`, no Docker needed) with 41 passing access-control
  assertions, which found and fixed real bugs (see [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)).
  Real browser-level WebRTC negotiation is also verified via Playwright, the admin console's 8
  pages are covered by Testing Library tests, and all 7 of the spec's critical user journeys are
  covered by real Playwright tests that drive the actual UI. A GitHub Actions CI pipeline runs
  this entire suite on every push/PR, with a gated Cloudflare Pages deploy job ready once
  repository secrets are added — nothing has actually been deployed from this environment. See
  [docs/TEST_REPORT.md](docs/TEST_REPORT.md) for exact results and coverage, and
  [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) for what's still unverified (mainly:
  Supabase's own hosted GoTrue/Realtime/pg_cron infrastructure, full server-side enforcement of
  account suspension, and a real cross-network call through a live project's STUN/TURN).
- This platform is a peer support community, **not** a crisis service, emergency responder, or
  substitute for professional mental healthcare. See the in-app Safety & Crisis Support page.

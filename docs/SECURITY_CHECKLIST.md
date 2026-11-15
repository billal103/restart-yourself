# Security Checklist

A scannable pass/fail view of the same 20 non-negotiable requirements `docs/SECURITY.md`
covers in full narrative detail. Use this to quickly see what's covered; use
`docs/SECURITY.md` for the why and the exact evidence (file, migration, test name)
behind each line.

**Legend:** ✅ Implemented & verified (genuinely executed, not just reviewed) · 🟡
Implemented, partially verified · ⬜ Not applicable / not built (by design or not yet)

| # | Requirement | Status |
|---|---|:---:|
| 1 | Never expose real identities publicly by default | ✅ |
| 2 | Auth identity always separate from public anonymous profile | ✅ |
| 3 | Secure guest publishing tokens (hash-only storage) | ✅ |
| 4 | Row Level Security enabled on every table, no defaults left open | ✅ |
| 5 | Private journals/mood/goals have **no** moderator or admin bypass | ✅ |
| 6 | Private messages stay private to participants until accepted | ✅ |
| 7 | Call signaling restricted to authorized participants; no recording | ✅ |
| 8 | Message requests require explicit accept before normal conversation | ✅ |
| 9 | Calls require explicit acceptance (no unsolicited connection) | ✅ |
| 10 | Blocking stops further contact, one-directional visibility | ✅ |
| 11 | Users can report harmful content (stories, comments, messages, calls) | ✅ |
| 12 | No unrestricted file uploads (size/type limits at the bucket level) | 🟡 — limits exist; no upload UI built yet to exercise them beyond the path-ownership test |
| 13 | Passwords never stored in plain text | ✅ (delegated to Supabase Auth/GoTrue) |
| 14 | Service-role key never exposed to the frontend | ✅ |
| 15 | No call recording by default | ✅ (no storage path for call media exists at all) |
| 16 | No private info in analytics | ⬜ — no analytics integration exists, so nothing to leak |
| 17 | No AI diagnosis of users | ⬜ — no AI features exist |
| 18 | Platform does not claim to replace therapy | ✅ (explicit copy on About/Safety/footer) |
| 19 | No false claims of emergency response / 24-7 monitoring | ✅ (explicit disclaimer on Safety page) |
| 20 | Privacy/safety prioritized over engagement metrics | ✅ (no follower counts, no public leaderboards) |

## Additional checks specific to this round of work

| Check | Status |
|---|:---:|
| Admin/moderation console itself respects RBAC (not just hidden buttons) | ✅ — `tests/db/run.mjs` proves a `content_moderator` cannot call admin-only RPCs |
| Account deletion cascades fully, doesn't leave orphaned private data | ✅ — proven against real Postgres, not just reasoned about |
| Account deletion doesn't erase the accountability trail | ✅ — audit entry survives, anonymized |
| Suspension enforced server-side (can't be bypassed by staying logged in) | 🟡 — recorded + RLS-protected; frontend-enforced at sign-in, not yet backed by a Supabase Auth Hook |
| Admin console can see other users' real emails | ⬜ — deliberately cannot; see `docs/KNOWN_LIMITATIONS.md` |

## How these were verified

- **41 real RLS/RPC assertions** against an actually-executed real Postgres engine
  (`tests/db/run.mjs`, `@electric-sql/pglite`, no Docker) — `npm run test:db`.
- **9 Playwright end-to-end tests**, including the 7 critical user journeys and real
  browser-level WebRTC negotiation — `npx playwright test`.
- **13 Vitest/Testing Library tests**, including all 8 admin pages rendered and
  clicked through — `npx vitest run`.

See `docs/TEST_REPORT.md` for the full breakdown of what each suite actually covers.

## A basic XSS check that was actually done

Grepped the entire `src/` tree for `dangerouslySetInnerHTML`, `eval(`, and
`new Function(` — **none exist anywhere in the codebase**. Every piece of
user-generated content (story text, comments, messages, journal entries) is rendered
through normal JSX text interpolation, which React escapes automatically. This doesn't
rule out every XSS vector (e.g. a malicious `href` in a future rich-text feature isn't
built, so there's nothing to check there yet), but it does rule out the most common
self-inflicted one: a component that was given raw user HTML to render.

## What this checklist is not

This is not a penetration test. SQL injection (mitigated structurally — every query
goes through parameterized PostgREST/RPC calls, never raw string-concatenated SQL, but
not independently fuzzed), CSRF, and session-handling attack surface (spec section 4.4)
have not been independently probed by an external tool or adversarial review in this
sandbox — see `docs/KNOWN_LIMITATIONS.md` and `docs/ROADMAP.md`.

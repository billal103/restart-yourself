# Test Report

All four suites below were run immediately before writing this report. Exact commands
are given so this is reproducible, not just asserted.

| Suite | Command | Result |
|---|---|---|
| TypeScript (strict, project-wide) | `npx tsc -b` | ✅ 0 errors |
| Lint | `npx oxlint` | ✅ 0 errors, 6 pre-existing non-blocking warnings (see below) |
| Unit / component (Vitest + Testing Library) | `npx vitest run` | ✅ 13 passed, 0 failed |
| Real-Postgres RLS/RPC (PGlite, no Docker) | `npm run test:db` | ✅ 41 passed, 0 failed |
| End-to-end (Playwright) | `npx playwright test` | ✅ 9 passed, 0 failed |
| Production build | `npm run build` | ✅ succeeds, no chunk-size warnings |

## What each suite actually covers

### `tests/db/run.mjs` — 41 assertions against a real Postgres engine

Not a mock, not a review — `@electric-sql/pglite` is real Postgres compiled to WASM.
The harness applies all 21 real migration files verbatim, creates real
`authenticated`/`anon` Postgres roles matching Supabase's own, seeds 5 fixture users,
and runs every assertion as those roles (never as the table owner, which is exempt
from its own RLS by default). Covers: personal-recovery privacy (including that an
admin genuinely cannot read another user's journal), blocking, the full message-request
→ accept → reply → notification chain, call visibility (the Milestone 3 fix,
re-verified), guest publish-token claiming, moderation RBAC, account status/suspension
RBAC, admin-stats RPC access control, rate limiting, group chat membership, content
reports, storage path-based ownership, anonymous-identity leakage, and cascading
account deletion. This run is what found 4 real SQL bugs plus a product-correctness
gap — see `docs/DATABASE_SCHEMA.md` ("Four real bugs found by testing").

### `tests/e2e/*.spec.ts` — 9 Playwright tests in a real Chromium browser

- `landing.spec.ts` — the landing page loads and links to Explore Stories.
- `user-journeys.spec.ts` — all 7 of the spec's critical user journeys, each driving
  the actual UI end-to-end against the mock-data path: anonymous browsing (explore →
  story → react → comment), guest story publishing, registration, personal recovery
  tools (journal, mood, goals), private messaging (accept a request, send a message),
  group chat (join, post), and calling (start → connect → end). Writing these caught a
  real bug: posting a comment in mock/demo mode silently did nothing — fixed in
  `src/pages/community/StoryDetailsPage.tsx`.
- `webrtc-mechanics.spec.ts` — two real Chromium browser contexts (fake camera/mic)
  run the actual `useWebRTCCall` negotiation code (`getUserMedia` →
  `RTCPeerConnection` → offer/answer/ICE exchange → connected → real media tracks
  delivered), with signals relayed via Playwright's `exposeFunction` standing in for
  Supabase Realtime (no live project exists in this sandbox).

### `tests/unit/*.test.{ts,tsx}` — 13 Vitest/Testing Library tests

- `utils.test.ts` — utility function coverage.
- `StoryCard.test.tsx` — a core display component renders correctly.
- `AdminPages.test.tsx` — all 8 admin console pages, rendered directly with a real
  `super_admin` or `content_moderator` user injected into the auth store, bypassing
  only the one-line route guard (already covered by reading it). Proves each page
  renders without crashing and that interactions actually work: approving a story,
  removing a reported comment, resolving a report, and role-gated Manage/New-Category
  controls being disabled for a moderator and working for an admin.

## The 6 pre-existing lint warnings

None are new, none are errors, and none block the build:

- `react(only-export-components)` ×2 (`button.tsx`, `badge.tsx`) — shadcn/ui's cva
  variant export pattern; cosmetic, affects only Fast Refresh during dev.
- `react(incompatible-library)` ×3 (`RegisterPage.tsx`, `ContactPage.tsx`,
  `StoryEditorPage.tsx`) — React Compiler can't memoize across `react-hook-form`'s
  API boundary; a known, documented limitation of that library, not a bug.
- `react(purity)` ×1 (`Footer.tsx`) — `new Date().getFullYear()` in the copyright
  line; technically impure during render, practically harmless (correct on every
  render regardless).

## What is explicitly not covered by any of the above

- Supabase's own hosted infrastructure: GoTrue's real HTTP/JWT issuing, the Realtime
  websocket transport end-to-end, and pg_cron's actual execution (`tests/db/run.mjs`
  stubs `auth.uid()` rather than running GoTrue, and skips the one pg_cron migration
  entirely — PGlite has no background-worker support).
  `supabase/tests/rls_privacy.sql` (pgTAP) exists for when a real Supabase/Docker
  stack becomes available, but has never been executed itself.
- A real cross-network call through a live project's STUN/TURN, between two actual
  devices on different networks.
- External adversarial security testing (XSS/SQLi/CSRF fuzzing, session-handling
  attacks) — see `docs/SECURITY_CHECKLIST.md` for what basic check *was* done.
- Full i18n coverage (English/Bangla parity exists for navigation and the login form
  only, by design, not by oversight).

See `docs/KNOWN_LIMITATIONS.md` for the complete, consolidated list.

# Known Limitations

Every item here is also mentioned where it's most relevant (`docs/SECURITY.md`,
`docs/REALTIME_AND_CALLING.md`, `docs/PROJECT_PROGRESS.md`) — this page exists so there
is one place that lists all of them together, instead of having to piece it together
from several documents.

## Infrastructure that has never run in this sandbox

- **No Docker, no live Supabase project, no GitHub remote existed here until this
  session set one up.** Everything below follows from that one constraint.
- **Supabase Auth (GoTrue)'s real HTTP/JWT issuing has never run.**
  `tests/db/run.mjs` stubs `auth.uid()` to read a session variable instead. The SQL,
  RLS, and RPC logic that runs *inside* Postgres is genuinely tested; GoTrue itself
  is not.
- **Supabase Realtime's websocket transport has never run end-to-end.** Every
  real-time feature (live messages, notifications, incoming calls) is wired to call
  it correctly, but the actual websocket relay has only been exercised with a direct
  signal-passing substitute in tests, not the real transport.
- **pg_cron has never executed.** It's a background worker, incompatible with
  PGlite's single-process WASM model, so migration 14 (stale call-signal cleanup) is
  reviewed by inspection only, not run.
- **No real cross-network WebRTC call has been placed.** `tests/e2e/webrtc-mechanics.spec.ts`
  proves the negotiation code itself is correct between two local browser contexts
  with signals relayed directly; it doesn't prove a call connects across the public
  internet, through real NAT, with Supabase Realtime as the signaling transport and
  real STUN/TURN in the path.
- **Nothing has been deployed.** The CI/CD pipeline (`.github/workflows/ci.yml`) and
  Cloudflare Pages setup (`docs/DEPLOYMENT.md`) are real and ready, but have never run
  against actual cloud infrastructure — no Cloudflare account or Supabase project is
  reachable from this sandbox.

## Product gaps, by design or by honest incompleteness

- **Account suspension is recorded and RLS-protected, but not server-enforced.**
  `authStore.ts` signs a suspended user out the next time they sign in or their
  session is restored — it cannot kill an already-open session mid-flight, because
  Postgres RLS has no concept of "this session is no longer welcome." Real enforcement
  needs a Supabase Auth Hook on a live project.
- **The admin console cannot show real email addresses.** The anon/authenticated
  client only ever has access to the `public` schema — `auth.users` (which holds
  email) is never exposed to it, by design, and there's no live project here to add a
  service-role Edge Function that could expose it safely without bypassing RLS
  entirely.
- **File uploads have size/type limits at the storage-bucket level, but no upload UI
  exists yet** (no avatar or story-image picker has been built) — the restriction is
  in place ahead of the feature that will need it, exercised only by a path-ownership
  test, not a real upload flow.
- **i18n (English/Bangla) covers navigation and the login form only.** Translating
  all ~46 pages' full content is a much larger task than fit alongside the backend
  work; the mechanism is proven to work, extending it page-by-page is straightforward
  follow-up.
- **Four admin pages are still Milestone 1 mock placeholders**: Community Management,
  Professional Management, Resource Management, and Platform Settings — never wired
  to real data in any milestone so far.
- **Discussions/forum threads** (`discussions`/`discussion_comments`) have full
  schema and RLS since Milestone 2 but no frontend page — the spec's page list never
  included one.
- **Rejecting a story or resolving a report doesn't separately notify the affected
  user** beyond what the notification triggers already cover (message requests,
  messages, comments, replies, reactions, group discussions) — moderation-outcome
  notifications were never added as their own trigger.
- **Landing page images are reasonably sized JPEGs, not converted to WebP/AVIF** —
  would likely save real bytes, but needs image-processing tooling
  (e.g. `sharp`) this sandbox doesn't have installed.

## Testing gaps

- **The pgTAP suite (`supabase/tests/rls_privacy.sql`) has never executed.** It
  covers materially the same ground as `tests/db/run.mjs`, which has, so this isn't a
  coverage gap in practice — it's a specific tool (`supabase test db`) that was never
  run because it needs Docker.
- **No external adversarial security testing.** XSS/SQLi/CSRF fuzzing and
  session-handling attacks (spec section 4.4) were not independently probed by a tool
  or a second reviewer — see `docs/SECURITY_CHECKLIST.md` for the basic, concrete
  checks that were actually done (no `dangerouslySetInnerHTML`/`eval` anywhere;
  parameterized queries throughout).
- **No load/performance testing under real traffic** — rate-limiting thresholds
  (e.g. 20 messages/minute) were picked as reasonable defaults, not tuned against
  real usage data.

None of these are hidden elsewhere and contradicted here — if a status line in another
doc ever seems to disagree with this page, this page and that doc should be read
together, not treated as two separate claims.

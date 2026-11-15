# Security & Privacy — Status

This document tracks the non-negotiable security and safety requirements from the
project brief (Section 5) and their real implementation status as of Milestone 4.

**Status key:** Implemented & wired = the UI calls real Supabase/RLS and it's live.
Implemented & verified against real Postgres = the SQL/RLS was actually executed —
not just reviewed — by `tests/db/run.mjs` (see "Genuine backend testing" below) and
passed. Schema-ready = the table/policy exists but no page calls it yet. Deferred =
genuinely not built yet.

| # | Requirement | Status |
|---|---|---|
| 1 | Never expose real identities publicly by default | **Implemented & verified against real Postgres.** `anonymous_profiles` is the only identity rendered anywhere public; RLS makes it readable but `auth.users` email/phone are never selected by any client query. The "anonymous display name is never Alice's email or any PII" assertion in `tests/db/run.mjs` executes this for real. |
| 2 | Separate auth identity from public anonymous profile | **Implemented & verified against real Postgres.** Enforced structurally — `anonymous_profiles` and `auth.users` are different tables with different RLS; no join ever returns both to a public query. |
| 3 | Secure guest publishing tokens | **Implemented & wired in UI, verified against real Postgres.** `issue_guest_token()`/`claim_guest_story()` store only a SHA-256 hash; `StoryEditorPage` shows the raw token exactly once, in a dialog the user must dismiss explicitly, with a copy button. `tests/db/run.mjs` actually calls both RPCs, confirms the wrong-token path is rejected, and the correct-token path transfers authorship — this run is also what caught Bug 4 below. |
| 4 | RLS on every private table | **Implemented & verified against real Postgres.** Every table in `supabase/migrations/` has `enable row level security` plus explicit policies — none are left at the Postgres default. `tests/db/run.mjs` exercises 41 real-world access scenarios across these policies as five different fixture users/roles, not as the table owner (owners are RLS-exempt by default, so the harness switches Postgres role before every assertion). |
| 5 | Private journals stay private | **Implemented & wired in UI, verified against real Postgres.** `journal_entries`/`mood_entries`/`recovery_goals` RLS has **no moderator or admin bypass at all**, by design — see `docs/DATABASE_SCHEMA.md`. `PrivateJournalPage`, `MoodTrackerPage`, `RecoveryGoalsPage` all call the real, owner-scoped service. `tests/db/run.mjs` proves this directly: it logs in as an admin and confirms the admin genuinely cannot read another user's journal entry — not just that the UI doesn't show a button for it. |
| 6 | Private messages stay private to participants | **Implemented & wired in UI, verified against real Postgres.** `conversations.status` implements the request/accept flow; `send_message()`/`start_conversation()` RPCs enforce it server-side. `PrivateChatPage` and `MyConversationsPage` call these for real, with a live Postgres Changes subscription for new messages. The request → accept → reply → notification chain, plus a non-member being unable to read the pending conversation at all, is executed end-to-end in `tests/db/run.mjs`. |
| 7 | Call signaling restricted to authorized participants | **Implemented & verified against real Postgres; browser-level negotiation also verified.** `call_signals` RLS scopes every row to `call_participants`; signals are cleaned up after 10 minutes via pg_cron on a real Supabase project (pg_cron itself isn't available in the WASM test harness, so that one migration is skipped there and reviewed by inspection only). `tests/db/run.mjs` verifies the callee can see a ringing call they haven't joined yet (the Milestone 3 fix) and that an outsider cannot read the signaling rows. Separately, `tests/e2e/webrtc-mechanics.spec.ts` runs two real Chromium browser contexts through `getUserMedia` → `RTCPeerConnection` → offer/answer/ICE exchange → connected state → `ontrack` media delivery — see `docs/REALTIME_AND_CALLING.md` for exactly what is and isn't covered by that test. |
| 8 | Message requests must be accepted before normal conversation | **Implemented & wired in UI, verified against real Postgres.** `respond_to_message_request()` is the only way a conversation moves from `pending` to `active`; `MyConversationsPage`'s Accept/Decline buttons call it for real. `tests/db/run.mjs` confirms only the recipient can call it (the sender cannot accept their own request) — this exercise is also what surfaced Bug 3 below. |
| 9 | Calls require explicit acceptance | **Implemented & wired in UI.** `IncomingCallListener` shows a modal dialog requiring Accept or Decline before `start_call`'s session ever becomes `active` — there is no path that connects a call without this step. |
| 10 | Blocking stops further contact | **Implemented & wired in UI, verified against real Postgres.** `start_conversation()` checks `blocks` both directions before allowing a new conversation; `PrivateChatPage`'s block button and `PrivacySettingsPage`'s block list both call the real `blocks` table. `tests/db/run.mjs` confirms a blocked user genuinely cannot start a conversation with their blocker, and that blocking is one-directional in `SELECT` (the blocked person can't see they were blocked). |
| 11 | Users can report harmful content | **Implemented & wired in UI, verified against real Postgres.** Story/comment reports (`reports`) and conversation/call/group-message reports (`communication_reports`) are both real inserts now, called from `StoryDetailsPage`, `PrivateChatPage`, and `GroupChatPage`. `tests/db/run.mjs` confirms a reporter can read their own report but not others', and a moderator can read every report. |
| 12 | No unrestricted file uploads | **Implemented, partially verified against real Postgres.** Every storage bucket has a `file_size_limit` and `allowed_mime_types` set at creation; `tests/db/run.mjs` confirms the path-based ownership policy (a user can only upload into their own avatar folder) against the stubbed `storage` schema. No page uploads files yet (no avatar/story-image UI built) — the restriction exists ahead of the feature that will need it. |
| 12a | Admin/moderation tooling itself must respect the same boundaries (not in the original numbered list, added here for traceability) | **Implemented & wired in UI, verified against real Postgres.** `StoryModerationPage`, `CommentModerationPage`, `MessageReportsPage`, `CallReportsPage`, `AuditLogsPage`, `UserManagementPage`, and `CategoryManagementPage` all call real tables/RPCs through `src/services/moderation.service.ts`, gated by the real `is_moderator()`/`is_admin()` RLS helpers — not just hidden buttons. A non-admin moderator can view `UserManagementPage`/`CategoryManagementPage` but the UI disables the admin-only actions, and the underlying RLS would reject them regardless. `tests/db/run.mjs` exercises this directly: a `content_moderator` cannot change account status or grant admin-only roles, and a non-moderator cannot read `get_admin_stats()` or `audit_logs`. |
| 13 | Never store passwords in plain text | **Implemented.** Supabase Auth (GoTrue) handles password hashing. |
| 14 | Never expose service-role keys | **Implemented.** Only the public URL and anon key are ever read by frontend code. No service-role key appears anywhere in `src/`. |
| 15 | No call recording by default | **Implemented.** The schema has no storage path for call media at all — there is nothing to turn off because it was never built. UI copy states this explicitly. |
| 16 | No private info in analytics | No analytics integration exists yet. |
| 17 | No AI diagnosis of users | No AI features exist yet. Safety page copy explicitly avoids diagnostic language. |
| 18 | Platform does not claim to replace therapy | Stated explicitly on `AboutPage`, `SafetyPage`, and footer disclaimer. |
| 19 | No false claims of emergency response / 24/7 monitoring | `SafetyPage` explicitly disclaims 24/7 monitoring and emergency contact capability. |
| 20 | Privacy and safety prioritized over engagement/growth | Reflected in design choices: no follower counts, no public leaderboards, reaction set limited to supportive responses only. |

## Genuine backend testing (Milestone 4)

Milestone 3's honest caveat was that every RLS policy and RPC had been "written and
reviewed" but never actually executed, because this sandbox has no Docker and
therefore no `supabase start`. That gap is now closed, without Docker, using
`@electric-sql/pglite` — a real Postgres engine compiled to WebAssembly.
`tests/db/run.mjs`:

1. Boots a real, empty Postgres instance in-process.
2. Stubs only the two things a bare Postgres lacks that Supabase provides for free —
   minimal `auth` and `storage` schemas, and an `auth.uid()` that reads a session
   variable instead of a JWT — and applies all 21 real migration files from
   `supabase/migrations/` verbatim, in order (skipping only the `pg_cron` scheduled-job
   migration, since pg_cron is a background worker incompatible with PGlite's
   single-process model — that one migration is reviewed by inspection, not executed).
3. Creates real `authenticated`/`anon` Postgres roles matching Supabase's own, seeds
   five fixture users, and runs every assertion **as those roles**, switching role
   before each one — critical, because a table's owner is exempt from its own RLS
   policies unless `FORCE ROW LEVEL SECURITY` is set, so testing as the owner would
   silently prove nothing.
4. Asserts 41 real access-control scenarios (ownership, blocking, message requests,
   call visibility, guest token claims, moderation RBAC, account status/RBAC, admin
   stats access, cascading account deletion, rate limiting, group membership,
   reporting, storage path ownership, anonymous identity) — all currently
   **passing**: `npm run test:db`.

This is a genuine upgrade from "reviewed" to "executed," and it found four real bugs
that code review alone had missed, documented in full in `docs/DATABASE_SCHEMA.md` and
fixed in `supabase/migrations/20260101000019_fix_recursion_and_search_path.sql`: two
RLS infinite-recursion bugs (`conversation_members`, `call_participants`), one missing
enum cast in `respond_to_message_request()`, and one `search_path` bug in
`issue_guest_token()`/`claim_guest_story()` that would have broken on a real Supabase
project too, not just in this harness.

**What is still not verified in this sandbox:** Supabase Auth's actual HTTP/JWT issuing
and GoTrue's own session-cookie behavior (the test harness stubs `auth.uid()` rather
than running GoTrue itself), the Realtime websocket transport end-to-end, pg_cron's
actual execution, and real cross-network WebRTC calls through public STUN/TURN — see
`docs/REALTIME_AND_CALLING.md`. All of the SQL, RLS, and RPC logic that runs *inside*
Postgres is now genuinely tested; the thin layer of Supabase-hosted infrastructure
around it (GoTrue, Realtime, pg_cron) is still "implemented and reviewed," same as the
old caveat, just a much smaller remaining surface than before.

## New in Milestone 4: real account deletion, and the 7 user journeys

"You can request account and data deletion at any time from your privacy settings"
was a real claim on `PrivacyPolicyPage` since Milestone 1, but the two buttons behind
it (`PrivacySettingsPage`'s "Export My Data" and "Delete My Account") had no handler at
all until now. Both are real:

- **Delete My Account** calls `request_account_deletion()`
  (`20260101000021_account_deletion_and_export.sql`), a security-definer RPC that
  deletes the caller's `auth.users` row. Every table that stores the user's own content
  (`anonymous_profiles`, `stories`, `comments`, `journal_entries`, `messages`, group
  memberships, and more) was already designed with `on delete cascade` on its ownership
  foreign key, and every moderation/accountability table (`moderation_actions`,
  `audit_logs`, `reports`) was designed with `on delete set null` instead — so deletion
  removes everything the user owns while leaving the moderation/audit trail intact but
  anonymized. `tests/db/run.mjs` proves this for real: creates a throwaway user, gives
  them a story and a journal entry, deletes their account, and confirms both are gone
  while a logged deletion event survives with its actor field nulled out.
- **Export My Data** (`profileService.exportMyData()`) gathers the user's own profile,
  preferences, stories, journal entries, mood logs, and recovery goals (every query
  already scoped by RLS to their own rows) into a JSON file the browser downloads
  directly — a real export, not a placeholder.
- Three legal pages that were previously only promised ("see Milestone 4 deliverables")
  are now real: `/data-retention`, `/account-deletion`, `/cookies` — each documents the
  actual mechanism above, not generic boilerplate.

Separately, **all 7 of the spec's critical user journeys are now covered by real
Playwright tests** (`tests/e2e/user-journeys.spec.ts`): anonymous browsing (react,
comment), guest story publishing, registration, the personal recovery tools (journal,
mood, goals), private messaging (accept a request, send a message), group chat (join,
post), and calling (start, connect, end) — each test drives the actual UI end-to-end in
a real browser against the mock-data path. Writing these found a real bug no amount of
code review had caught: posting a comment in mock/demo mode (no Supabase configured)
silently cleared the textarea and did nothing else — the comment never appeared,
anywhere. Fixed in `src/pages/community/StoryDetailsPage.tsx` to actually append the
new comment to local state, matching the pattern every other mock-mode page already
uses. This is exactly the category of bug that only running the journey, not reading
the code, reveals.

## New in Milestone 4: account suspension, and its real enforcement boundary

`UserManagementPage`'s "status" column (active/restricted/suspended) is now real,
backed by a dedicated `user_account_status` table
(`20260101000020_account_status_and_admin_stats.sql`) rather than left as unbacked mock
data. It's a separate table, not a column on `anonymous_profiles`, deliberately: a
column there would fall under "users manage their own anonymous profile" (RLS has no
column-level restriction in Postgres), so a suspended user could simply set their own
status back to `active`. The dedicated table closes that hole the same way `user_roles`
already does for roles — only `is_admin()` can write to it, and `tests/db/run.mjs`
proves a non-admin's own attempt to reverse their suspension has no effect.

**The honest limit of this feature:** the suspension record itself is real and
RLS-protected, but nothing in Postgres automatically terminates a suspended user's
existing session or blocks their other RLS-permitted actions — Postgres RLS has no
concept of "this session is no longer welcome." The frontend half closes most of the
practical gap: `authStore.ts` checks `user_account_status` immediately after a real
sign-in or session restore and signs the account back out if suspended (see
`rejectIfSuspended()` in `src/stores/authStore.ts`). A real production deployment would
also want a Supabase Auth Hook rejecting the session server-side on every request, which
requires a live project and can't be configured from this sandbox — documented here
rather than silently assumed to be covered.

## New in Milestone 3: rate limiting and a real bug fix

- **Rate limiting** (spec 3.4/3.8 "apply rate limits to prevent spam") is now real, not
  aspirational: a generic Postgres trigger (`20260101000016_rate_limiting.sql`) caps new
  messages, comments, group messages, reports, and conversations per user per time
  window, enforced in the database — not just in the UI, so it can't be bypassed by
  calling the API directly.
- **A real RLS bug was found and fixed** while wiring the incoming-call UI: the original
  policy only let the caller see a `call_sessions` row, meaning the person being called
  could never discover their own incoming call. Fixed in
  `20260101000017_fix_call_visibility.sql`. Full story in `docs/DATABASE_SCHEMA.md`. This
  is exactly the kind of mistake `supabase test db` against a live database would catch
  immediately — another argument for actually running the test suite, not just reviewing it.

## What "verified" does and doesn't mean here

The Milestone 3 status of "written and reviewed, not executed" is gone for the SQL/RLS
layer — `tests/db/run.mjs` genuinely runs it, as a real Postgres engine would, under
the same role-based access control a production Supabase project enforces. The
Milestone 3 Playwright pass against the mock-data fallback path is still accurate and
still valuable (it proves the dual-mode UI logic), but the real-Supabase code path no
longer rests on that alone — it rests on 32 passing assertions against real executed
SQL, plus a real browser-level WebRTC negotiation test. What remains unverified in this
sandbox — Supabase's own GoTrue/Realtime/pg_cron infrastructure and real cross-network
calls — is scoped precisely in the "Genuine backend testing" section above, not left as
a vague caveat.

## Next Steps

- Run the full `tests/db/run.mjs` suite and `tests/e2e/webrtc-mechanics.spec.ts` against
  a real Supabase project (not just PGlite/local Chromium) once one exists, to close the
  remaining GoTrue/Realtime/pg_cron/cross-network gap.
- Full external security testing (XSS, SQL injection, session handling) remains
  Milestone 4 Section 4.4 scope, separate from this RLS/RPC verification work.

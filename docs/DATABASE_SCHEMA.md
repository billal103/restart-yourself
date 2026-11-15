# Database Schema

Implemented in `supabase/migrations/` (21 files, applied in order by the Supabase CLI).
Seed data for local/dev is in `supabase/seed.sql`. All 21 migrations have been executed
for real against a real Postgres engine (`tests/db/run.mjs`, via `@electric-sql/pglite`)
— see "Security testing" below.

## Tables by group

| Group | Tables | Migration |
|---|---|---|
| User Management | `anonymous_profiles`, `user_roles`, `user_preferences` | `20260101000002_users_and_roles.sql` |
| Stories | `categories`, `tags`, `stories`, `story_tags`, `story_media`, `story_revisions` | `20260101000003_stories.sql` |
| Community Interactions | `reactions`, `comments`, `bookmarks`, `blocks`, `reports` | `20260101000004_community_interactions.sql` |
| Messaging | `conversations`, `conversation_members`, `messages`, `message_attachments` | `20260101000005_messaging.sql` |
| Calling | `call_sessions`, `call_participants`, `call_signals` | `20260101000006_calling.sql` |
| Communities & Groups | `communities`, `community_members`, `group_chat_rooms`, `group_messages`, `discussions`, `discussion_comments` | `20260101000007_communities_and_groups.sql` |
| Personal Recovery | `journal_entries`, `mood_entries`, `recovery_goals`, `goal_milestones` | `20260101000008_personal_recovery.sql` |
| Notifications | `notifications`, `notification_preferences` | `20260101000009_notifications.sql` |
| Moderation | `moderation_actions`, `audit_logs`, `communication_reports`, `crisis_events` | `20260101000010_moderation.sql` |
| Professional Resources | `professionals`, `professional_verifications`, `resources` | `20260101000011_professional_resources.sql` |
| Storage | buckets: `avatars`, `story-media`, `community-images`, `journal-attachments`, `professional-documents` | `20260101000012_storage_buckets.sql` |
| Guest Publishing | `guest_publish_tokens` | `20260101000013_guest_publish_tokens.sql` |
| Scheduled jobs | pg_cron cleanup of stale call signals | `20260101000014_scheduled_cleanup.sql` |
| Notification triggers | Wires `notify_user()` to new message requests, messages, comments, replies, reactions, group messages; adds those tables to the `supabase_realtime` publication | `20260101000015_notification_triggers.sql` |
| Rate limiting | Generic `enforce_rate_limit()` trigger applied to messages, comments, group messages, reports, and new conversations | `20260101000016_rate_limiting.sql` |
| Call visibility fix | Corrects `call_sessions` RLS so the *callee*, not just the caller, can see an incoming ringing call (see "A real bug found" below) | `20260101000017_fix_call_visibility.sql` |
| PostgREST embedding FKs | Adds explicitly-named FKs straight to `anonymous_profiles(user_id)` from `comments`, `group_messages`, `conversation_members`, `community_members`, `blocks`, `stories`, `messages`, so the JS client can embed author/profile data in one query | `20260101000018_profile_embedding_fkeys.sql` |
| Recursion and search_path fixes | Fixes two RLS infinite-recursion bugs, one enum-cast bug, one `search_path` bug, and adds the community-creator-auto-join trigger — all four found by actually executing the migrations for the first time; see "Four real bugs found by testing" below | `20260101000019_fix_recursion_and_search_path.sql` |
| Account status & admin stats | Adds `user_account_status` (active/restricted/suspended, admin-write-only — backs `UserManagementPage`) and the `get_admin_stats()`/`set_user_account_status()` RPCs used by the now-wired admin console | `20260101000020_account_status_and_admin_stats.sql` |
| Account deletion | Adds `request_account_deletion()` — a security-definer RPC backing the real "Delete My Account" button in `PrivacySettingsPage`, cascading through every table a user owns while anonymizing (not deleting) moderation/audit records about them | `20260101000021_account_deletion_and_export.sql` |

## Deliberate deviations from the spec's literal table list

A few tables from the original brief were intentionally merged into existing
mechanisms instead of added as separate tables, to avoid two sources of truth for the
same state:

- **`users` / `guest_sessions`** — not separate tables. Supabase Auth's `auth.users`
  already is the auth-identity table, and guest access uses Supabase's built-in
  anonymous sign-in (`auth.users.is_anonymous`), which already tracks sessions. Adding
  parallel tables would just risk drifting out of sync with what Supabase Auth itself
  tracks.
- **`message_requests`** — not a separate table. `conversations.status` (`pending` →
  `active`/`declined`) *is* the request state. A pending conversation is the request;
  accepting it is a single atomic status change via the `respond_to_message_request()`
  RPC, rather than juggling a request row and a conversation row that could disagree.
- **`group_chat_members`** — not separate from `community_members`. Every community
  member can read/post in that community's chat room in this product; there's no case
  where membership and chat-access diverge, so one table does both jobs.

## Anonymous identity system

- `anonymous_profiles` is always separate from `auth.users` (email/password). A trigger
  (`handle_new_user()`) creates one automatically for every new `auth.users` row —
  registered or anonymous/guest — with a generated display name (`generate_anonymous_name()`)
  and a random avatar color. Nothing in the public schema ever stores or exposes email
  or phone number.
- Guests get a real, if lightweight, Supabase session via anonymous sign-in — enough to
  manage their stories for as long as that browser/session lasts.
- `guest_publish_tokens` exists specifically for the case the spec calls out: the guest
  loses that session. `issue_guest_token()` returns a random token *once* and stores
  only its SHA-256 hash; `claim_guest_story()` lets a different session take over
  authorship by presenting the exact token. No RLS policy grants any direct access to
  this table — every interaction goes through these two `SECURITY DEFINER` functions.

## Row Level Security

Every table has RLS enabled. The two guarantees worth calling out explicitly:

- **Private journals, mood entries, and recovery goals have no moderator or admin
  bypass anywhere** (`20260101000008_personal_recovery.sql`) — this was a non-negotiable
  requirement, not an oversight. If staff ever need visibility here, it must be a new,
  explicit, audited mechanism, never an added bypass in this file.
- **Blocking is one-directional in `SELECT`** — a user can see who *they* blocked, not
  who blocked *them*, matching common product expectations around not tipping off a
  blocked person.

Full policy-by-policy reasoning is in the SQL comments in each migration file — they're
written to be read, not just executed.

## A real bug found while wiring the frontend (Milestone 3)

The original `call_sessions` SELECT policy (Milestone 2) only let the *caller* or an
already-joined `call_participants` row read a call session. That meant the person being
called could never see their own incoming call — RLS silently hid the very row the
"incoming call" UI needed, because you can't join a call you can't see in order to
decide whether to join it. `20260101000017_fix_call_visibility.sql` fixes this by also
allowing any member of the underlying conversation to see its call sessions, which
grants no more access than they already have (they can already read every message in
that same conversation). Caught by actually building the incoming-call listener
(`src/components/calling/IncomingCallListener.tsx`) and reasoning through what it would
need to query — not by running it against a database, since none was available in this
session. Treat it as a reminder that "written and reviewed" still means "not tested."

## Four real bugs found by testing (Milestone 4)

This sandbox has no Docker, so Milestones 2–3 could only write and review the SQL
above, never actually run it. Milestone 4 closes that gap with
`@electric-sql/pglite` — a real Postgres engine compiled to WASM — driven by
`tests/db/run.mjs`, which applies every migration and runs 32 access-control
assertions as real `authenticated`/`anon` Postgres roles (not as the table owner,
which is exempt from RLS by default and would silently prove nothing). Running the
schema for the first time surfaced four real bugs, all fixed in
`20260101000019_fix_recursion_and_search_path.sql`:

1. **`conversation_members`'s own SELECT policy queried `conversation_members`** from
   inside an `EXISTS` subquery in its own policy, which made Postgres re-apply RLS to
   that inner query — which hits the same policy again, forever:
   `infinite recursion detected in policy for relation "conversation_members"`. Fixed
   with a `SECURITY DEFINER` helper function, `is_conversation_member()`, which runs as
   the function owner and so doesn't re-trigger RLS on its own internal query.
2. **The identical recursion bug on `call_participants`**, fixed the same way with
   `is_call_participant()`. `call_sessions`' SELECT policy was also simplified to use
   both helpers for consistency, though it was never itself recursive.
3. **`respond_to_message_request()` failed with `column "status" is of type
   conversation_status but expression is of type text`** — a `CASE` expression's
   branches need an explicit `::conversation_status` cast; Postgres doesn't always
   infer the target enum type automatically inside an `UPDATE ... SET` context.
4. **`issue_guest_token()`/`claim_guest_story()` failed with `function
   gen_random_bytes(integer) does not exist`** (and the same for `digest()`). Both
   functions declared `set search_path = public`, which — per Postgres semantics —
   *replaces* the search_path for that function's execution rather than extending it,
   silently dropping the `extensions` schema that pgcrypto was installed into
   (migration 1). Fixed by changing both to `set search_path = public, extensions`.
   This would have failed identically on a real Supabase project, not just this test
   harness — it was a real latent bug, not a test-environment artifact.

A fifth, non-crashing product-correctness gap was found at the same time: creating a
community never made the creator a member of it, so a moderator who created a group
couldn't see or post in their own chat room without a separate "join" step. Fixed with
an `add_creator_as_community_moderator()` trigger that auto-joins the creator as a
`moderator` the moment the `communities` row is inserted.

None of these five issues were visible from reading the SQL — they only surfaced once
the policies, functions, and triggers were actually executed. This is the concrete
argument for "run it, don't just read it" that earlier milestone docs could only state
as a caveat.

## PostgREST embedding requires direct foreign keys

A second mistake worth recording: several service files (`comments.service.ts`,
`groups.service.ts`, `messaging.service.ts`, `social.service.ts`) originally tried to
embed `anonymous_profiles` data through tables that only referenced `auth.users`, not
`anonymous_profiles` directly. PostgREST (what `.select('*, anonymous_profiles(...)')`
compiles to) can't infer a join path through a third table — it needs a real foreign
key between the two tables being embedded. `20260101000018_profile_embedding_fkeys.sql`
adds those second, explicitly-named FKs. This was caught immediately by `tsc` (the
hand-written `database.types.ts` surfaced it as a `SelectQueryError` type), not by a
live query — another case for why `npx supabase test db` against a real database
matters before trusting any of this in production.

## Security testing

Two real test suites exist:

- `tests/db/run.mjs` — runs all 21 migrations against a real Postgres engine
  (`@electric-sql/pglite`, no Docker needed) and asserts 41 RLS/RPC access-control
  scenarios as real `authenticated`/`anon` roles. This is what found the four bugs
  above (plus the account-status/admin-stats RBAC and real cascading account
  deletion added in Milestone 4). Run it with `npm run test:db`.
- `supabase/tests/rls_privacy.sql` — a pgTAP suite covering the same highest-stakes
  guarantees (journal privacy including against an admin, blocked-user messaging,
  guest token claim with a wrong token), intended to run against a real Supabase/Docker
  stack once one is available (`npx supabase start && npx supabase test db`). This
  suite is still written-and-reviewed-only in this sandbox — `tests/db/run.mjs` is the
  one that has actually been executed, and it covers materially the same ground plus
  messaging, calling, and rate limiting.

See `docs/SECURITY.md` for the full breakdown of what is and isn't verified by each.

## Frontend type mirror

`src/types/domain.ts` (frontend-facing shapes) and `src/lib/supabase/database.types.ts`
(hand-written, used by the services that are actually wired up) both mirror this
schema. Once a real project exists, regenerate full types with:

```powershell
npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
```

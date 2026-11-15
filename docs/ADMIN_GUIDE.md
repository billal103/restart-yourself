# Admin User Guide

Who this is for: anyone granted a moderator or admin role, operating the `/admin`
console. This covers what each page does, who can do what, and the handful of things
the console cannot yet do.

## Becoming a moderator or admin

There is no self-service way to grant yourself a role — by design, `user_roles` is
writable only by an existing admin (`20260101000002_users_and_roles.sql`). The very
first admin on a new project has to be granted directly in the database:

```sql
-- Run once, via the Supabase SQL editor or psql, against your own project.
insert into user_roles (user_id, role)
values ('<the auth.users id of the person to promote>', 'admin');
```

After that, use `/admin/users` → **Manage** → **Grant** to hand out roles to anyone
else through the UI instead of SQL.

The five roles, from least to most privileged for console purposes: `registered` (no
console access), `verified_professional` / `supporter` (no console access — these
affect what's shown elsewhere, not moderation), `group_moderator` and
`content_moderator` (console access, most actions), `admin` / `super_admin` (console
access, every action). `AdminLayout` lets in any of `admin`, `super_admin`,
`content_moderator`, `group_moderator` — RLS is what actually separates admin-only
actions from moderator actions underneath, not the page guard.

## What a moderator can do vs. what requires admin

RLS enforces this server-side regardless of what the UI shows or hides, so this table
is about which buttons actually do something for each role, not a security boundary:

| Action | Moderator | Admin |
|---|---|---|
| Approve/reject pending stories | ✅ | ✅ |
| Remove reported comments | ✅ | ✅ |
| Resolve message/call reports | ✅ | ✅ |
| Read audit logs / admin stats | ✅ | ✅ |
| Grant or revoke a role | ❌ (disabled in UI) | ✅ |
| Change a user's account status | ❌ (disabled in UI) | ✅ |
| Create/edit a category | ❌ (disabled in UI) | ✅ |

## Page-by-page

**Overview** (`/admin`) — platform-wide counts (registered/guest users, stories by
status, open message reports, comments, communities, moderation actions today) via a
single `get_admin_stats()` call, plus the 5 most recent audit log entries.

**User Management** (`/admin/users`) — search/filter members, then **Manage** a
specific one to grant/revoke roles and set account status (active/restricted/
suspended) with an optional note. Suspending someone signs them out the next time they
sign in or their session is restored — **it does not kill a session that's already
open right now**; see `docs/KNOWN_LIMITATIONS.md`. Email addresses always show as
hidden in real mode — there is no way for this console to see them (see the same doc).

**Story Moderation** (`/admin/stories`) — Pending Review / Published tabs. Approve
publishes the story immediately; Reject sets it to `rejected` (the author is not
separately notified by this action today — see Roadmap). Both actions are recorded in
the audit log.

**Comment Moderation** (`/admin/comments`) — lists comments that have an open report
against them (not every comment on the platform). Remove marks the comment removed and
resolves the report in one action.

**Message Reports** / **Call Reports** (`/admin/reports/messages`,
`/admin/reports/calls`) — open `communication_reports` split by target type. Mark
Resolved closes the report; only report metadata and the reporter's written reason are
ever visible here, never message/call content (there is none to see — calls are never
recorded, and this page was never given access to message bodies).

**Audit Logs** (`/admin/audit-logs`) — the full, read-only history of every moderation
action taken through this console (and the self-service account-deletion events users
trigger themselves). Nothing here can be edited or deleted, including by an admin.

**Category Management** (`/admin/categories`) — admin-only create/edit, with a live
story count per category.

**Communities, Professionals, Resources, Platform Settings** (`/admin/communities`,
`/admin/professionals`, `/admin/resources`, `/admin/settings`) — still Milestone 1 mock
placeholders; not covered by this guide because they're not wired yet (see
`docs/ROADMAP.md`).

## If something looks wrong

Every write this console makes goes through RLS the same way any other client request
would — there's no admin bypass that skips it. If an action silently does nothing,
check the browser console for an RLS rejection before assuming the button is broken.

# Supabase Setup Guide

The app runs with **zero backend configuration** — leave `.env.local` unset and every
page works against the Milestone 1 mock data, same as before. This guide is for
turning on the real backend built in Milestone 2.

## Option A — Local development stack (requires Docker)

This runs Postgres, Auth, Storage, and the rest of the Supabase stack entirely on your
machine, no account needed.

```powershell
# One-time: Docker Desktop must be installed and running first.
npx supabase start
```

This applies every migration in `supabase/migrations/` and the seed data in
`supabase/seed.sql` automatically, then prints a local API URL and anon key. Put those
into `.env.local`:

```powershell
Copy-Item .env.example .env.local
# then edit .env.local with the printed values, e.g.:
#   VITE_SUPABASE_URL=http://127.0.0.1:54321
#   VITE_SUPABASE_ANON_KEY=<printed anon key>
```

Restart `npm run dev` after creating/editing `.env.local` (Vite only reads env files on
startup). You can also run the database security tests at this point:

```powershell
npx supabase test db
```

Stop the stack with `npx supabase stop` when you're done (add `--no-backup` to also wipe
local data).

> This sandbox never had Docker available, so `supabase start`/`supabase test db`
> themselves have never run here. What *has* run here, against a real Postgres engine
> (`@electric-sql/pglite`, no Docker needed) is `tests/db/run.mjs` — it applies every
> migration verbatim and asserts 41 real RLS/RPC access-control scenarios, genuinely
> executed, not just reviewed. See `docs/SECURITY.md` for exactly what that does and
> doesn't cover versus a real Supabase project (GoTrue, Realtime, pg_cron are the
> remaining gap). Running `supabase start` the first time Docker is available is still
> worth doing, to close that specific gap — but "not executed against a real database"
> is no longer an accurate description of the SQL/RLS layer itself.

## Option B — A free Supabase Cloud project

1. Create a project at [supabase.com](https://supabase.com) (free tier).
2. Install the CLI and link your project:
   ```powershell
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   ```
3. Push the schema:
   ```powershell
   npx supabase db push
   ```
4. In the Supabase dashboard, go to Project Settings → API and copy the **Project URL**
   and **anon public key** into `.env.local` (same format as Option A).
5. Optionally load the seed data via the SQL editor (paste the contents of
   `supabase/seed.sql`) — `db push` does not run `seed.sql` automatically for a linked
   remote project.

## What's wired up vs. what's schema-only

As of Milestone 4, essentially everything is wired to the real backend when one is
connected — this table is now about depth of testing, not about what's still mock-only:

| Area | Status |
|---|---|
| Database schema, RLS policies (all 21 migrations) | ✅ Complete, and genuinely executed against real Postgres via `tests/db/run.mjs` (41 passing assertions) |
| Storage buckets + policies | ✅ Complete — see `20260101000012_storage_buckets.sql` |
| Auth (register, login, logout, guest, password reset) | ✅ Wired into the UI (`src/stores/authStore.ts`, auth pages) |
| Anonymous identity system | ✅ Wired — `handle_new_user()` trigger creates the profile automatically |
| Guest publish token recovery | ✅ Schema + RPCs wired (`src/services/stories.service.ts`, `StoryEditorPage`) |
| Stories, comments, reactions, bookmarks, blocking, reporting | ✅ Fully wired, dual-mode |
| Private messaging, group chat, calling (WebRTC signaling) | ✅ Fully wired, dual-mode — see `docs/REALTIME_AND_CALLING.md` |
| Personal recovery tools (journal, mood, goals) | ✅ Fully wired, dual-mode, no moderator bypass by design |
| Admin console (moderation, reports, audit logs, user roles/status, categories) | ✅ Fully wired — see `docs/SECURITY.md` "New in Milestone 4" |
| Account deletion / data export | ✅ Fully wired — real cascading deletion RPC, real JSON export |
| Supabase Auth's own HTTP/JWT issuing, Realtime websocket transport, pg_cron | ⬜ Reviewed, not executed in this sandbox (no Docker, no live project) — the one real remaining gap |

## Never do this

- Never put the **service-role key** in a `VITE_*` variable or anywhere under `src/`. It
  bypasses every RLS policy in this project. It belongs only in server-side contexts
  (Edge Function secrets, CI secrets) — this project doesn't currently define any Edge
  Functions that need it.
- Don't commit `.env` or `.env.local` — `.gitignore` already excludes them.

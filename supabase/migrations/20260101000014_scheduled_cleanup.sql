-- Periodic cleanup of short-lived WebRTC signaling rows.
-- pg_cron ships with Supabase's Postgres image both locally and in the
-- cloud. If a target database doesn't have it available, this file is the
-- only thing that fails to apply — every other migration is unaffected.

create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'cleanup-stale-call-signals',
  '*/10 * * * *',
  $$ select public.cleanup_stale_call_signals(); $$
);

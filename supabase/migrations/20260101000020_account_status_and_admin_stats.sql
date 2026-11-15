-- Milestone 4: account status (restrict/suspend) for UserManagementPage, and a
-- single admin-stats RPC so the dashboard doesn't need N separate client-side
-- count queries racing against RLS as a non-admin moderator.

create type account_status as enum ('active', 'restricted', 'suspended');

-- A separate table, not a column on anonymous_profiles, deliberately: a
-- column there would be covered by "Users manage their own anonymous
-- profile" (update using auth.uid() = user_id), which has no column-level
-- restriction in Postgres RLS — a suspended user could simply set their own
-- status back to 'active'. A dedicated admin-only-write table closes that
-- hole the same way `user_roles` already does for roles. Absence of a row
-- means 'active', mirroring how absence of a `user_roles` row means lowest
-- privilege (see 20260101000002_users_and_roles.sql).
create table public.user_account_status (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status account_status not null default 'active',
  notes text,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.user_account_status enable row level security;

create policy "Users read their own account status"
  on public.user_account_status for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Only admins set account status"
  on public.user_account_status for insert
  with check (public.is_admin());

create policy "Only admins update account status"
  on public.user_account_status for update
  using (public.is_admin())
  with check (public.is_admin());

-- Known limitation, documented rather than silently assumed away: this table
-- records a suspension; it does not by itself block the suspended user from
-- continuing to call other RLS-protected endpoints or from staying logged
-- in. Real enforcement (e.g. rejecting their session at sign-in) requires a
-- Supabase Auth Hook configured on a live project, which cannot be set up
-- from this sandbox. The frontend checks this table right after sign-in and
-- signs a suspended user back out — see src/services/moderation.service.ts
-- and docs/SECURITY.md for the exact scope of that enforcement.

create function public.set_user_account_status(
  p_user_id uuid,
  p_status account_status,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change account status';
  end if;

  insert into public.user_account_status (user_id, status, notes, updated_by, updated_at)
  values (p_user_id, p_status, p_notes, auth.uid(), now())
  on conflict (user_id) do update
    set status = excluded.status, notes = excluded.notes, updated_by = excluded.updated_by, updated_at = now();

  perform public.record_moderation_action('user', p_user_id, 'set_account_status:' || p_status::text, p_notes);
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin dashboard stats: one security-definer RPC rather than several
-- client-side count queries, so a content_moderator/group_moderator (who
-- can reach the admin console but isn't an admin) gets accurate platform-
-- wide totals instead of an RLS-filtered undercount on tables like
-- user_roles that are admin-only to SELECT across other users.
-- ---------------------------------------------------------------------------

create function public.get_admin_stats()
returns table (
  registered_users bigint,
  guest_users bigint,
  total_stories bigint,
  published_stories bigint,
  pending_stories bigint,
  reported_stories bigint,
  total_comments bigint,
  active_communities bigint,
  message_reports bigint,
  moderation_actions_today bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_moderator() then
    raise exception 'Only moderators can read admin statistics';
  end if;

  return query
  select
    (select count(distinct user_id) from public.user_roles),
    (select count(*) from public.anonymous_profiles) - (select count(distinct user_id) from public.user_roles),
    (select count(*) from public.stories),
    (select count(*) from public.stories where status = 'published'),
    (select count(*) from public.stories where status = 'pending'),
    (select count(*) from public.reports where target_type = 'story' and status = 'open'),
    (select count(*) from public.comments where is_removed = false),
    (select count(*) from public.communities),
    (select count(*) from public.communication_reports where status = 'open' and target_type in ('message', 'conversation')),
    (select count(*) from public.moderation_actions where created_at >= date_trunc('day', now()));
end;
$$;

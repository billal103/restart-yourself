-- Moderation actions, the platform audit trail, communication-specific
-- reports (messages/calls/group chat — distinct from the story/comment
-- `reports` table in 0004), and crisis escalation tracking.

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references auth.users (id) on delete set null,
  target_type text not null,
  target_id uuid not null,
  action text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  target text,
  created_at timestamptz not null default now()
);

create table public.communication_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users (id) on delete set null,
  target_type text not null check (target_type in ('message', 'conversation', 'call', 'group_message')),
  target_id uuid not null,
  reason text not null check (char_length(reason) > 0),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create table public.crisis_events (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.stories (id) on delete set null,
  reported_by uuid references auth.users (id) on delete set null,
  status text not null default 'flagged' check (status in ('flagged', 'reviewed', 'escalated', 'closed')),
  notes text,
  created_at timestamptz not null default now()
);

-- Convenience wrapper so application code calls one function for a
-- moderator action and gets both the action record and the audit log entry,
-- rather than risking the two falling out of sync.
create function public.record_moderation_action(
  p_target_type text,
  p_target_id uuid,
  p_action text,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_moderator() then
    raise exception 'Only moderators can record moderation actions';
  end if;

  insert into public.moderation_actions (moderator_id, target_type, target_id, action, notes)
  values (auth.uid(), p_target_type, p_target_id, p_action, p_notes)
  returning id into v_id;

  insert into public.audit_logs (actor_id, action, target)
  values (auth.uid(), p_action, p_target_type || ':' || p_target_id);

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.moderation_actions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.communication_reports enable row level security;
alter table public.crisis_events enable row level security;

create policy "Moderators read moderation actions"
  on public.moderation_actions for select
  using (public.is_moderator());

create policy "Moderators read audit logs"
  on public.audit_logs for select
  using (public.is_moderator());

create policy "Reporters submit and track their own communication reports"
  on public.communication_reports for select
  using (reporter_id = auth.uid() or public.is_moderator());

create policy "Authenticated users file a communication report"
  on public.communication_reports for insert
  with check (reporter_id = auth.uid());

create policy "Moderators resolve communication reports"
  on public.communication_reports for update
  using (public.is_moderator())
  with check (public.is_moderator());

create policy "Reporters and moderators see crisis events they're involved in"
  on public.crisis_events for select
  using (reported_by = auth.uid() or public.is_moderator());

create policy "Authenticated users flag a crisis event"
  on public.crisis_events for insert
  with check (reported_by = auth.uid());

create policy "Moderators update crisis event status"
  on public.crisis_events for update
  using (public.is_moderator())
  with check (public.is_moderator());

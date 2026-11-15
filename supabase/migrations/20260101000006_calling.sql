-- Voice/video call sessions and short-lived WebRTC signaling.
-- Calls are never recorded; this schema stores only session/signal metadata.

create type call_type as enum ('voice', 'video');
create type call_status as enum ('ringing', 'active', 'ended', 'missed', 'declined');

create table public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  caller_id uuid not null references auth.users (id) on delete cascade,
  type call_type not null,
  status call_status not null default 'ringing',
  started_at timestamptz not null default now(),
  connected_at timestamptz,
  ended_at timestamptz
);

create table public.call_participants (
  call_id uuid not null references public.call_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz,
  left_at timestamptz,
  primary key (call_id, user_id)
);

create table public.call_signals (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.call_sessions (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  signal_type text not null check (signal_type in ('offer', 'answer', 'ice-candidate')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create function public.start_call(p_conversation_id uuid, p_type call_type)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_call_id uuid;
  v_other_user_id uuid;
begin
  if not exists (
    select 1 from public.conversation_members
    where conversation_id = p_conversation_id and user_id = auth.uid()
  ) then
    raise exception 'Not a member of this conversation';
  end if;

  select user_id into v_other_user_id
  from public.conversation_members
  where conversation_id = p_conversation_id and user_id <> auth.uid()
  limit 1;

  if exists (
    select 1 from public.user_preferences where user_id = v_other_user_id and allow_calls = false
  ) then
    raise exception 'This user is not accepting calls';
  end if;

  insert into public.call_sessions (conversation_id, caller_id, type)
  values (p_conversation_id, auth.uid(), p_type)
  returning id into v_call_id;

  insert into public.call_participants (call_id, user_id, joined_at)
  values (v_call_id, auth.uid(), now());

  return v_call_id;
end;
$$;

-- Deletes signaling rows older than 10 minutes. Call signals are only ever
-- needed for the few seconds it takes to negotiate a connection.
create function public.cleanup_stale_call_signals()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.call_signals where created_at < now() - interval '10 minutes';
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.call_sessions enable row level security;
alter table public.call_participants enable row level security;
alter table public.call_signals enable row level security;

create policy "Participants read their own call sessions"
  on public.call_sessions for select
  using (exists (
    select 1 from public.call_participants cp
    where cp.call_id = call_sessions.id and cp.user_id = auth.uid()
  ) or caller_id = auth.uid());

create policy "Participants update status on their own call"
  on public.call_sessions for update
  using (exists (
    select 1 from public.call_participants cp
    where cp.call_id = call_sessions.id and cp.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.call_participants cp
    where cp.call_id = call_sessions.id and cp.user_id = auth.uid()
  ));

create policy "Participants read the roster of their own call"
  on public.call_participants for select
  using (exists (
    select 1 from public.call_participants cp2
    where cp2.call_id = call_participants.call_id and cp2.user_id = auth.uid()
  ));

create policy "The recipient can join a ringing call"
  on public.call_participants for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.call_sessions cs
      join public.conversation_members cm on cm.conversation_id = cs.conversation_id
      where cs.id = call_id and cm.user_id = auth.uid()
    )
  );

create policy "Participants read signals for their own call"
  on public.call_signals for select
  using (exists (
    select 1 from public.call_participants cp
    where cp.call_id = call_signals.call_id and cp.user_id = auth.uid()
  ));

create policy "Participants send signals as themselves"
  on public.call_signals for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.call_participants cp
      where cp.call_id = call_id and cp.user_id = auth.uid()
    )
  );

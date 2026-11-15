-- Four real bugs found by actually executing every migration against a real
-- Postgres engine for the first time (Milestone 4 — see docs/SECURITY.md for
-- the full story). None of these were visible from reading the SQL; all
-- four only surfaced once the policies and functions were run for real.

-- ---------------------------------------------------------------------------
-- Bug 1: "infinite recursion detected in policy for relation
-- conversation_members". Its own SELECT policy queried conversation_members
-- from inside conversation_members' policy — Postgres re-applies RLS to that
-- inner query, which hits the same policy again, forever. Fixed with a
-- SECURITY DEFINER helper, which runs as the owner and so doesn't re-trigger
-- RLS on its own internal query.
-- ---------------------------------------------------------------------------

create function public.is_conversation_member(p_conversation_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = p_conversation_id and user_id = p_user_id
  );
$$;

drop policy "Members see the membership rows of their own conversations" on public.conversation_members;

create policy "Members see the membership rows of their own conversations"
  on public.conversation_members for select
  using (public.is_conversation_member(conversation_id));

-- ---------------------------------------------------------------------------
-- Bug 2: the identical recursion bug on call_participants, same fix shape.
-- ---------------------------------------------------------------------------

create function public.is_call_participant(p_call_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.call_participants
    where call_id = p_call_id and user_id = p_user_id
  );
$$;

drop policy "Participants read the roster of their own call" on public.call_participants;

create policy "Participants read the roster of their own call"
  on public.call_participants for select
  using (public.is_call_participant(call_id));

-- Other policies that referenced call_participants/conversation_members from
-- a *different* table were never recursive, but now read more simply through
-- the same helpers for consistency.
drop policy "Conversation members see call sessions in their own conversation" on public.call_sessions;

create policy "Conversation members see call sessions in their own conversation"
  on public.call_sessions for select
  using (
    caller_id = auth.uid()
    or public.is_call_participant(id)
    or public.is_conversation_member(conversation_id)
  );

-- ---------------------------------------------------------------------------
-- Bug 3: respond_to_message_request failed with "column status is of type
-- conversation_status but expression is of type text" — the CASE
-- expression's branches needed an explicit cast to the enum type; Postgres
-- doesn't always infer it automatically in an UPDATE ... SET context.
-- ---------------------------------------------------------------------------

create or replace function public.respond_to_message_request(p_conversation_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_initiated_by uuid;
begin
  select initiated_by into v_initiated_by
  from public.conversations
  where id = p_conversation_id and status = 'pending';

  if v_initiated_by is null then
    raise exception 'No pending request found';
  end if;

  if v_initiated_by = auth.uid() then
    raise exception 'Only the recipient can respond to a message request';
  end if;

  if not exists (
    select 1 from public.conversation_members
    where conversation_id = p_conversation_id and user_id = auth.uid()
  ) then
    raise exception 'Not a member of this conversation';
  end if;

  update public.conversations
  set status = (case when p_accept then 'active' else 'declined' end)::conversation_status
  where id = p_conversation_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Bug 4: issue_guest_token()/claim_guest_story() failed with "function
-- digest(text, unknown) does not exist" / "function gen_random_bytes(...)
-- does not exist". Both declared `set search_path = public`, which — per
-- Postgres semantics — *replaces* the search_path for the function's
-- execution rather than extending it, dropping the `extensions` schema
-- pgcrypto was installed into (migration 1). This would have failed on a
-- real Supabase project too, not just this test harness.
-- ---------------------------------------------------------------------------

create or replace function public.issue_guest_token(p_story_id uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_token text;
begin
  if not exists (
    select 1 from public.stories
    where id = p_story_id and author_id = auth.uid() and is_guest_authored
  ) then
    raise exception 'Only the guest author of this story can request a recovery token';
  end if;

  v_token := encode(gen_random_bytes(24), 'base64');

  insert into public.guest_publish_tokens (story_id, token_hash)
  values (p_story_id, encode(digest(v_token, 'sha256'), 'hex'))
  on conflict (story_id) do update set token_hash = excluded.token_hash, created_at = now();

  return v_token;
end;
$$;

create or replace function public.claim_guest_story(p_story_id uuid, p_token text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_matches boolean;
begin
  select (token_hash = encode(digest(p_token, 'sha256'), 'hex')) into v_matches
  from public.guest_publish_tokens
  where story_id = p_story_id;

  if not coalesce(v_matches, false) then
    return false;
  end if;

  update public.stories set author_id = auth.uid() where id = p_story_id;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Product-correctness fix found at the same time, not just a crash: creating
-- a community never made the creator a member of it, so a moderator who
-- creates a group couldn't see or post in its own chat room without a
-- separate, easy-to-forget "join" step. Auto-join the creator as a
-- community moderator.
-- ---------------------------------------------------------------------------

create function public.add_creator_as_community_moderator()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.community_members (community_id, user_id, role)
    values (new.id, new.created_by, 'moderator')
    on conflict (community_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger add_creator_as_community_moderator_after_insert
  after insert on public.communities
  for each row execute function public.add_creator_as_community_moderator();

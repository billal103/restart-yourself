-- Private messaging. `conversations.status` implements the "message request"
-- concept from the spec (a pending conversation IS the request) instead of a
-- separate message_requests table, to keep accept/decline atomic and avoid
-- two sources of truth for the same state.

create type conversation_status as enum ('pending', 'active', 'declined');

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  initiated_by uuid not null references auth.users (id) on delete cascade,
  status conversation_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  is_hidden boolean not null default false,
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index messages_conversation_id_idx on public.messages (conversation_id, created_at);

create table public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  storage_path text not null,
  content_type text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RPCs — conversation creation and membership inserts happen here instead of
-- through direct table policies, so a 2-row (members) + 1-row (first message)
-- operation is atomic and a user can never insert a membership row for
-- someone else directly.
-- ---------------------------------------------------------------------------

create function public.start_conversation(p_recipient_id uuid, p_first_message text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation_id uuid;
begin
  if p_recipient_id = auth.uid() then
    raise exception 'Cannot start a conversation with yourself';
  end if;

  if exists (select 1 from public.blocks where blocker_id = p_recipient_id and blocked_id = auth.uid())
    or exists (select 1 from public.blocks where blocker_id = auth.uid() and blocked_id = p_recipient_id)
  then
    raise exception 'Messaging is not available between these users';
  end if;

  if exists (
    select 1 from public.user_preferences
    where user_id = p_recipient_id and allow_messages = false
  ) then
    raise exception 'This user is not accepting message requests';
  end if;

  insert into public.conversations (initiated_by, status)
  values (auth.uid(), 'pending')
  returning id into v_conversation_id;

  insert into public.conversation_members (conversation_id, user_id)
  values (v_conversation_id, auth.uid()), (v_conversation_id, p_recipient_id);

  insert into public.messages (conversation_id, sender_id, content)
  values (v_conversation_id, auth.uid(), p_first_message);

  return v_conversation_id;
end;
$$;

create function public.respond_to_message_request(p_conversation_id uuid, p_accept boolean)
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
  set status = case when p_accept then 'active' else 'declined' end
  where id = p_conversation_id;
end;
$$;

create function public.send_message(p_conversation_id uuid, p_content text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status conversation_status;
  v_initiated_by uuid;
  v_message_id uuid;
begin
  select status, initiated_by into v_status, v_initiated_by
  from public.conversations
  where id = p_conversation_id;

  if v_status is null then
    raise exception 'Conversation not found';
  end if;

  if not exists (
    select 1 from public.conversation_members
    where conversation_id = p_conversation_id and user_id = auth.uid()
  ) then
    raise exception 'Not a member of this conversation';
  end if;

  if v_status = 'declined' then
    raise exception 'This conversation was declined';
  end if;

  if v_status = 'pending' and v_initiated_by <> auth.uid() then
    raise exception 'Accept the message request before replying';
  end if;

  insert into public.messages (conversation_id, sender_id, content)
  values (p_conversation_id, auth.uid(), p_content)
  returning id into v_message_id;

  return v_message_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;

create policy "Members read their own conversations"
  on public.conversations for select
  using (exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = conversations.id and cm.user_id = auth.uid()
  ));

-- No direct insert/update policy: conversations are only created or
-- transitioned through the security-definer RPCs above.

create policy "Members see the membership rows of their own conversations"
  on public.conversation_members for select
  using (exists (
    select 1 from public.conversation_members cm2
    where cm2.conversation_id = conversation_members.conversation_id and cm2.user_id = auth.uid()
  ));

create policy "Members hide their own conversation entry"
  on public.conversation_members for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Members read messages in their own conversations"
  on public.messages for select
  using (exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()
  ));

-- No direct insert policy: messages are only created through send_message()
-- / start_conversation(), which enforce the request/accept/block rules above.

create policy "Senders mark their own sent messages, recipients mark read"
  on public.messages for update
  using (exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()
  ));

create policy "Attachments follow their parent message's visibility"
  on public.message_attachments for select
  using (exists (
    select 1 from public.messages m
    join public.conversation_members cm on cm.conversation_id = m.conversation_id
    where m.id = message_attachments.message_id and cm.user_id = auth.uid()
  ));

create policy "Senders attach files to their own message"
  on public.message_attachments for insert
  with check (exists (
    select 1 from public.messages m where m.id = message_id and m.sender_id = auth.uid()
  ));

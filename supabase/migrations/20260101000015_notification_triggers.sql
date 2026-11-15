-- Wires the notify_user() primitive from Milestone 2 to the events the spec
-- actually lists under Notification System (3.11): message requests, new
-- messages, comments, replies, reactions, group discussion activity.
-- Call requests and recovery reminders are left to the frontend (a call
-- request notification only matters while the recipient is online, and
-- recovery reminders are scheduled, not event-driven).

-- Fires once per conversation, the moment the second membership row is
-- inserted (i.e. right after start_conversation() finishes), so the
-- recipient — never the initiator — gets the "new message request" alert.
create function public.notify_new_member_if_second()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_count int;
  v_initiated_by uuid;
begin
  select count(*) into v_member_count
  from public.conversation_members where conversation_id = new.conversation_id;

  if v_member_count = 2 then
    select initiated_by into v_initiated_by
    from public.conversations where id = new.conversation_id;

    if new.user_id <> v_initiated_by then
      perform public.notify_user(
        new.user_id, 'message_request', 'New message request',
        'Someone sent you a message request after reading your story.'
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger notify_on_conversation_members_complete
  after insert on public.conversation_members
  for each row execute function public.notify_new_member_if_second();

create function public.notify_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient uuid;
  v_status conversation_status;
begin
  select status into v_status from public.conversations where id = new.conversation_id;

  select user_id into v_recipient
  from public.conversation_members
  where conversation_id = new.conversation_id and user_id <> new.sender_id
  limit 1;

  -- The first message of a pending request is already covered by the
  -- message-request notification above; only notify for messages in an
  -- already-active conversation, to avoid a duplicate notification.
  if v_recipient is not null and v_status = 'active' then
    perform public.notify_user(v_recipient, 'message', 'New message', 'You have a new message.');
  end if;
  return new;
end;
$$;

create trigger notify_on_message_after_insert
  after insert on public.messages
  for each row execute function public.notify_on_message();

create function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_story_author uuid;
  v_parent_author uuid;
begin
  select author_id into v_story_author from public.stories where id = new.story_id;

  if new.parent_id is not null then
    select author_id into v_parent_author from public.comments where id = new.parent_id;
    if v_parent_author is not null and v_parent_author <> new.author_id then
      perform public.notify_user(v_parent_author, 'reply', 'New reply', 'Someone replied to your comment.');
    end if;
  end if;

  if v_story_author is not null and v_story_author <> new.author_id then
    perform public.notify_user(v_story_author, 'comment', 'New comment', 'Someone commented on your story.');
  end if;
  return new;
end;
$$;

create trigger notify_on_comment_after_insert
  after insert on public.comments
  for each row execute function public.notify_on_comment();

create function public.notify_on_reaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_story_author uuid;
begin
  select author_id into v_story_author from public.stories where id = new.story_id;
  if v_story_author is not null and v_story_author <> new.user_id then
    perform public.notify_user(v_story_author, 'reaction', 'New support reaction', 'Your story received a new reaction.');
  end if;
  return new;
end;
$$;

create trigger notify_on_reaction_after_insert
  after insert on public.reactions
  for each row execute function public.notify_on_reaction();

create function public.notify_on_group_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_community_id uuid;
  v_member record;
begin
  select community_id into v_community_id from public.group_chat_rooms where id = new.room_id;

  for v_member in
    select user_id from public.community_members
    where community_id = v_community_id and user_id <> new.author_id
  loop
    perform public.notify_user(
      v_member.user_id, 'group_discussion', 'New activity in your group',
      'There is a new message in a group you belong to.'
    );
  end loop;
  return new;
end;
$$;

create trigger notify_on_group_message_after_insert
  after insert on public.group_messages
  for each row execute function public.notify_on_group_message();

-- ---------------------------------------------------------------------------
-- Realtime: enable Postgres Changes for the tables the frontend subscribes
-- to for live updates (messages, group chat, notifications, conversation
-- status changes for the accept/decline flow, and call signaling).
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.group_messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.call_signals;
alter publication supabase_realtime add table public.call_sessions;

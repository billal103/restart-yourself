-- Notifications. Rows are written only by triggers/edge functions (security
-- definer), never directly by clients — a user can read, mark read, and
-- delete their own notifications, but cannot fabricate one for themselves.

create type notification_type as enum (
  'message_request', 'message', 'comment', 'reply', 'reaction',
  'group_discussion', 'call_request', 'moderation', 'recovery_reminder'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id, created_at desc);

create table public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  messages boolean not null default true,
  reactions boolean not null default true,
  groups boolean not null default true,
  calls boolean not null default true,
  recovery boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger set_notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

create function public.notify_user(
  p_user_id uuid,
  p_type notification_type,
  p_title text,
  p_body text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notifications (user_id, type, title, body)
  values (p_user_id, p_type, p_title, p_body);
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

create policy "Users read their own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users mark their own notifications read"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete their own notifications"
  on public.notifications for delete
  using (user_id = auth.uid());

create policy "Users manage their own notification preferences"
  on public.notification_preferences for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

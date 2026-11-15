-- User management: anonymous identity system, roles, preferences.
--
-- Design note: Supabase Auth's `auth.users` already covers "users" (authentication
-- identity) and guest access (via anonymous sign-in, auth.users.is_anonymous = true),
-- so this schema does not duplicate a separate `users` or `guest_sessions` table.
-- `anonymous_profiles` is the public identity, always separate from the auth identity
-- (email, password) per the non-negotiable anonymous-identity requirement.

create type app_role as enum (
  'registered',
  'supporter',
  'group_moderator',
  'content_moderator',
  'verified_professional',
  'admin',
  'super_admin'
);

-- Generic trigger function: keeps an `updated_at` column current on every update.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.anonymous_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_color text not null default '#6d4bd6',
  is_verified_professional boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.anonymous_profiles is
  'Public identity shown on stories/comments/messages. Never exposes auth.users email or phone.';

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role app_role not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users (id) on delete set null,
  primary key (user_id, role)
);

create table public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  allow_messages boolean not null default true,
  allow_calls boolean not null default true,
  show_online_status boolean not null default false,
  ai_moderation_assist boolean not null default true,
  language text not null default 'en',
  updated_at timestamptz not null default now()
);

create trigger set_user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Role helper functions (security definer so they can be used freely inside
-- RLS policies without those policies needing direct SELECT grants).
-- ---------------------------------------------------------------------------

create function public.has_role(p_user_id uuid, p_role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = p_user_id and role = p_role
  );
$$;

create function public.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(p_user_id, 'admin') or public.has_role(p_user_id, 'super_admin');
$$;

create function public.is_moderator(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin(p_user_id)
    or public.has_role(p_user_id, 'content_moderator')
    or public.has_role(p_user_id, 'group_moderator');
$$;

-- ---------------------------------------------------------------------------
-- Anonymous display name generation (mirrors the frontend's generator so
-- names look consistent whether created client-side for demos or here).
-- ---------------------------------------------------------------------------

create function public.generate_anonymous_name()
returns text
language sql
volatile
as $$
  select (
    (array['Quiet','Gentle','Brave','Hopeful','Resilient','Steady','Calm','Wandering','Patient','Bright'])
      [1 + floor(random() * 10)::int]
    || (array['Willow','River','Harbor','Maple','Comet','Meadow','Lantern','Sparrow','Horizon','Juniper'])
      [1 + floor(random() * 10)::int]
    || (100 + floor(random() * 900)::int)::text
  );
$$;

-- New auth.users row -> anonymous profile + preferences + default role.
-- Anonymous (guest) sign-ins get a profile but no persisted role row; absence
-- of a role is treated as lowest privilege everywhere else in this schema.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.anonymous_profiles (user_id, display_name, avatar_color)
  values (
    new.id,
    public.generate_anonymous_name(),
    (array['#6d4bd6','#ab8fe1','#4caf6f','#d9a43c','#5934c0','#8a6fe3'])[1 + floor(random() * 6)::int]
  );

  insert into public.user_preferences (user_id) values (new.id);

  if coalesce(new.is_anonymous, false) = false then
    insert into public.user_roles (user_id, role) values (new.id, 'registered');
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.anonymous_profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_preferences enable row level security;

-- Display names/avatars are the whole point of the anonymous identity system:
-- they must be readable by everyone so stories/comments/messages can show them.
create policy "Anonymous profiles are publicly readable"
  on public.anonymous_profiles for select
  using (true);

create policy "Users manage their own anonymous profile"
  on public.anonymous_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users read their own roles"
  on public.user_roles for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Only admins grant or revoke roles"
  on public.user_roles for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users manage their own preferences"
  on public.user_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

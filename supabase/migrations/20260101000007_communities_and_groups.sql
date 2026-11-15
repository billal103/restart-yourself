-- Topic-based community groups: membership, real-time group chat, and
-- longer-form threaded discussions. `community_members` doubles as group
-- chat membership (spec's `group_chat_members`) since every community member
-- can read/post in that community's chat room — there is no case in this
-- product where someone is a community member but excluded from its chat.

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  guidelines text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.community_members (
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'moderator')),
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create table public.group_chat_rooms (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null unique references public.communities (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.group_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.group_chat_rooms (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  is_removed boolean not null default false,
  created_at timestamptz not null default now()
);

create index group_messages_room_id_idx on public.group_messages (room_id, created_at);

create table public.discussions (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table public.discussion_comments (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.discussions (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- Every community automatically gets exactly one chat room.
create function public.create_group_chat_room()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_chat_rooms (community_id) values (new.id);
  return new;
end;
$$;

create trigger create_group_chat_room_after_insert
  after insert on public.communities
  for each row execute function public.create_group_chat_room();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.group_chat_rooms enable row level security;
alter table public.group_messages enable row level security;
alter table public.discussions enable row level security;
alter table public.discussion_comments enable row level security;

create policy "Communities are publicly browsable"
  on public.communities for select using (true);

create policy "Moderators create and manage communities"
  on public.communities for all
  using (public.is_moderator())
  with check (public.is_moderator());

create policy "Community membership lists are public"
  on public.community_members for select using (true);

create policy "Users join a community themselves"
  on public.community_members for insert
  with check (user_id = auth.uid());

create policy "Users leave a community themselves"
  on public.community_members for delete
  using (user_id = auth.uid());

create policy "Community or platform moderators manage member roles"
  on public.community_members for update
  using (public.is_moderator())
  with check (public.is_moderator());

create policy "Platform moderators remove members"
  on public.community_members for delete
  using (public.is_moderator());

create policy "Chat rooms are visible to community members"
  on public.group_chat_rooms for select
  using (exists (
    select 1 from public.community_members cm
    where cm.community_id = group_chat_rooms.community_id and cm.user_id = auth.uid()
  ));

create policy "Group messages are visible to community members"
  on public.group_messages for select
  using (
    not is_removed
    and exists (
      select 1 from public.group_chat_rooms r
      join public.community_members cm on cm.community_id = r.community_id
      where r.id = group_messages.room_id and cm.user_id = auth.uid()
    )
  );

create policy "Community members post in the group chat"
  on public.group_messages for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.group_chat_rooms r
      join public.community_members cm on cm.community_id = r.community_id
      where r.id = room_id and cm.user_id = auth.uid()
    )
  );

create policy "Authors or moderators remove a group message"
  on public.group_messages for update
  using (author_id = auth.uid() or public.is_moderator())
  with check (author_id = auth.uid() or public.is_moderator());

create policy "Discussions are publicly browsable"
  on public.discussions for select using (true);

create policy "Community members start a discussion"
  on public.discussions for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.community_members cm
      where cm.community_id = community_id and cm.user_id = auth.uid()
    )
  );

create policy "Discussion comments are publicly browsable"
  on public.discussion_comments for select using (true);

create policy "Community members comment on a discussion"
  on public.discussion_comments for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.discussions d
      join public.community_members cm on cm.community_id = d.community_id
      where d.id = discussion_id and cm.user_id = auth.uid()
    )
  );

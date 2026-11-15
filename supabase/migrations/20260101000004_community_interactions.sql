-- Reactions, comments, bookmarks, blocks, and content reports.

create type reaction_type as enum (
  'understand', 'sending_support', 'not_alone', 'stay_strong', 'thank_you'
);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reaction_type reaction_type not null,
  created_at timestamptz not null default now(),
  unique (story_id, user_id, reaction_type)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  is_removed boolean not null default false,
  created_at timestamptz not null default now()
);

create index comments_story_id_idx on public.comments (story_id);
create index comments_parent_id_idx on public.comments (parent_id);

create table public.bookmarks (
  user_id uuid not null references auth.users (id) on delete cascade,
  story_id uuid not null references public.stories (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, story_id)
);

create table public.blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users (id) on delete set null,
  target_type text not null check (target_type in ('story', 'comment')),
  target_id uuid not null,
  reason text not null check (char_length(reason) > 0),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.reactions enable row level security;
alter table public.comments enable row level security;
alter table public.bookmarks enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

create policy "Reactions are readable wherever the story is readable"
  on public.reactions for select
  using (exists (
    select 1 from public.stories s
    where s.id = reactions.story_id
      and (s.status = 'published' or s.author_id = auth.uid() or public.is_moderator())
  ));

create policy "Users react to visible stories with their own identity"
  on public.reactions for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.stories s where s.id = story_id and s.status = 'published')
  );

create policy "Users remove their own reaction"
  on public.reactions for delete
  using (user_id = auth.uid());

create policy "Comments are readable wherever the story is readable"
  on public.comments for select
  using (
    not is_removed
    and exists (
      select 1 from public.stories s
      where s.id = comments.story_id
        and (s.status = 'published' or s.author_id = auth.uid() or public.is_moderator())
    )
    or public.is_moderator()
  );

create policy "Users comment on published stories with their own identity"
  on public.comments for insert
  with check (
    author_id = auth.uid()
    and exists (select 1 from public.stories s where s.id = story_id and s.status = 'published')
  );

create policy "Authors edit their own comment content"
  on public.comments for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "Moderators remove any comment"
  on public.comments for update
  using (public.is_moderator())
  with check (public.is_moderator());

create policy "Authors or moderators delete a comment"
  on public.comments for delete
  using (author_id = auth.uid() or public.is_moderator());

create policy "Users manage their own bookmarks"
  on public.bookmarks for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users see who they have blocked, not the reverse"
  on public.blocks for select
  using (blocker_id = auth.uid());

create policy "Users manage their own blocks"
  on public.blocks for insert
  with check (blocker_id = auth.uid());

create policy "Users remove their own blocks"
  on public.blocks for delete
  using (blocker_id = auth.uid());

create policy "Reporters submit and track their own reports"
  on public.reports for select
  using (reporter_id = auth.uid() or public.is_moderator());

create policy "Authenticated users file a report"
  on public.reports for insert
  with check (reporter_id = auth.uid());

create policy "Moderators resolve reports"
  on public.reports for update
  using (public.is_moderator())
  with check (public.is_moderator());

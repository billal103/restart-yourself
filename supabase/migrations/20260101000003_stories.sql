-- Stories: categories, tags, the stories table itself, media, and revisions.

create type story_status as enum ('draft', 'pending', 'published', 'rejected', 'archived');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  created_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null
);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  title text not null check (char_length(title) between 5 and 150),
  content text not null check (char_length(content) between 50 and 10000),
  excerpt text,
  status story_status not null default 'draft',
  content_warnings text[] not null default '{}',
  publish_anonymously boolean not null default true,
  is_guest_authored boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index stories_author_id_idx on public.stories (author_id);
create index stories_category_id_idx on public.stories (category_id);
create index stories_status_idx on public.stories (status);
create index stories_published_at_idx on public.stories (published_at desc);

create trigger set_stories_updated_at
  before update on public.stories
  for each row execute function public.set_updated_at();

-- Stamp published_at the moment a story's status actually becomes 'published'.
create function public.set_story_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and old.status is distinct from 'published' then
    new.published_at = now();
  end if;
  return new;
end;
$$;

create trigger set_stories_published_at
  before update on public.stories
  for each row execute function public.set_story_published_at();

create table public.story_tags (
  story_id uuid not null references public.stories (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (story_id, tag_id)
);

create table public.story_media (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  storage_path text not null,
  media_type text not null check (media_type in ('image')),
  created_at timestamptz not null default now()
);

create table public.story_revisions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  title text not null,
  content text not null,
  edited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Snapshot the previous title/content before any edit, for moderation history.
create function public.snapshot_story_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.title is distinct from new.title or old.content is distinct from new.content then
    insert into public.story_revisions (story_id, title, content, edited_by)
    values (old.id, old.title, old.content, auth.uid());
  end if;
  return new;
end;
$$;

create trigger snapshot_story_revision_before_update
  before update on public.stories
  for each row execute function public.snapshot_story_revision();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.stories enable row level security;
alter table public.story_tags enable row level security;
alter table public.story_media enable row level security;
alter table public.story_revisions enable row level security;

create policy "Categories are publicly readable" on public.categories for select using (true);
create policy "Only admins manage categories" on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

create policy "Tags are publicly readable" on public.tags for select using (true);
create policy "Only admins manage tags" on public.tags for all
  using (public.is_admin()) with check (public.is_admin());

create policy "Published stories are public; authors and moderators see the rest"
  on public.stories for select
  using (
    status = 'published'
    or author_id = auth.uid()
    or public.is_moderator()
  );

create policy "Authenticated users create their own stories"
  on public.stories for insert
  with check (author_id = auth.uid());

-- Authors can edit their own story and move it between draft/pending, but
-- cannot self-approve to 'published' or self-clear a 'rejected' status.
create policy "Authors edit their own draft or pending stories"
  on public.stories for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid() and status in ('draft', 'pending'));

create policy "Moderators manage any story, including status transitions"
  on public.stories for update
  using (public.is_moderator())
  with check (public.is_moderator());

create policy "Authors or moderators delete a story"
  on public.stories for delete
  using (author_id = auth.uid() or public.is_moderator());

create policy "Story tags follow story visibility"
  on public.story_tags for select
  using (exists (
    select 1 from public.stories s
    where s.id = story_tags.story_id
      and (s.status = 'published' or s.author_id = auth.uid() or public.is_moderator())
  ));

create policy "Authors manage tags on their own story"
  on public.story_tags for all
  using (exists (
    select 1 from public.stories s where s.id = story_tags.story_id and s.author_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.stories s where s.id = story_tags.story_id and s.author_id = auth.uid()
  ));

create policy "Story media follows story visibility"
  on public.story_media for select
  using (exists (
    select 1 from public.stories s
    where s.id = story_media.story_id
      and (s.status = 'published' or s.author_id = auth.uid() or public.is_moderator())
  ));

create policy "Authors manage media on their own story"
  on public.story_media for all
  using (exists (
    select 1 from public.stories s where s.id = story_media.story_id and s.author_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.stories s where s.id = story_media.story_id and s.author_id = auth.uid()
  ));

create policy "Authors and moderators read story revision history"
  on public.story_revisions for select
  using (exists (
    select 1 from public.stories s
    where s.id = story_revisions.story_id
      and (s.author_id = auth.uid() or public.is_moderator())
  ));

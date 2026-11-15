-- Private journal, mood tracking, and recovery goals.
--
-- SECURITY: these tables have NO moderator or admin bypass policy, anywhere,
-- on purpose. Per the spec's non-negotiable requirements, moderators must
-- never have unrestricted access to private journals. If a future feature
-- needs staff visibility here, it must be a separate, explicit, audited
-- mechanism — never a blanket RLS bypass added to this file.

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_journal_entries_updated_at
  before update on public.journal_entries
  for each row execute function public.set_updated_at();

create table public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  level smallint not null check (level between 1 and 5),
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create table public.recovery_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  target_date date,
  is_complete boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.goal_milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.recovery_goals (id) on delete cascade,
  title text not null,
  is_complete boolean not null default false,
  position int not null default 0
);

-- ---------------------------------------------------------------------------
-- Row Level Security — owner-only, full stop.
-- ---------------------------------------------------------------------------

alter table public.journal_entries enable row level security;
alter table public.mood_entries enable row level security;
alter table public.recovery_goals enable row level security;
alter table public.goal_milestones enable row level security;

create policy "Journal entries are private to their owner"
  on public.journal_entries for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Mood entries are private to their owner"
  on public.mood_entries for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Recovery goals are private to their owner"
  on public.recovery_goals for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Goal milestones are private to the goal's owner"
  on public.goal_milestones for all
  using (exists (
    select 1 from public.recovery_goals g where g.id = goal_milestones.goal_id and g.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.recovery_goals g where g.id = goal_milestones.goal_id and g.user_id = auth.uid()
  ));

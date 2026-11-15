-- Professional directory, verification workflow, and external crisis/support
-- resources (the public resource list shown on the Safety page).

create type verification_status as enum ('unverified', 'pending', 'verified');

create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  title text not null,
  bio text,
  specializations text[] not null default '{}',
  contact_url text,
  verification_status verification_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.professional_verifications (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals (id) on delete cascade,
  reviewed_by uuid references auth.users (id) on delete set null,
  document_storage_path text,
  status verification_status not null default 'pending',
  notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null,
  url text not null,
  region text not null default 'Global',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.professionals enable row level security;
alter table public.professional_verifications enable row level security;
alter table public.resources enable row level security;

create policy "Professional directory is publicly readable"
  on public.professionals for select using (true);

create policy "Users apply as a professional under their own account"
  on public.professionals for insert
  with check (user_id = auth.uid());

create policy "Professionals edit their own profile, not their own verification status"
  on public.professionals for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and verification_status = 'pending');

create policy "Admins manage any professional profile, including verification"
  on public.professionals for update
  using (public.is_admin())
  with check (public.is_admin());

-- Verification documents and reviewer notes are sensitive; only moderators
-- and admins can see them. The applicant sees their own status via the
-- public professionals.verification_status column instead.
create policy "Moderators manage professional verification records"
  on public.professional_verifications for all
  using (public.is_moderator())
  with check (public.is_moderator());

create policy "Resources are publicly readable"
  on public.resources for select using (true);

create policy "Admins manage resources"
  on public.resources for all
  using (public.is_admin())
  with check (public.is_admin());

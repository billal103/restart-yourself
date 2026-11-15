-- Guest publishing recovery tokens.
--
-- Guests already get a real (if lightweight) session via Supabase anonymous
-- sign-in, which is enough to manage their stories for as long as that
-- session/browser lasts. This table exists for the case the spec explicitly
-- calls out: the guest loses that session (clears cookies, switches
-- devices) and has no other way to prove they wrote a given story. We store
-- only a SHA-256 hash of the token, never the token itself, and the token is
-- returned to the caller exactly once, at creation time.

create table public.guest_publish_tokens (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null unique references public.stories (id) on delete cascade,
  token_hash text not null,
  created_at timestamptz not null default now()
);

-- No RLS policy grants any direct access to this table at all — every
-- interaction goes through the security-definer functions below, so a
-- lost/stolen session can never read another story's token hash.
alter table public.guest_publish_tokens enable row level security;

create function public.issue_guest_token(p_story_id uuid)
returns text
language plpgsql
security definer
set search_path = public
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

comment on function public.issue_guest_token is
  'Returns the raw recovery token to the caller exactly once. Losing it means '
  'the story can only be managed from the original browser session.';

create function public.claim_guest_story(p_story_id uuid, p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
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

comment on function public.claim_guest_story is
  'Lets whoever presents the correct token take over authorship of a guest '
  'story from the current session, e.g. after losing the original one.';

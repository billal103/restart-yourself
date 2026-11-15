-- RLS security tests, run with: supabase start && supabase test db
--
-- These exercise the specific guarantees the spec calls "non-negotiable":
-- private journals stay private (even from moderators/admins), blocked
-- users can't message around a block, and the guest token recovery path
-- only works with the correct token.
--
-- Pattern: insert two fake auth.users rows with known ids, then simulate
-- "being" each one by setting the same JWT claim Supabase's own auth.uid()
-- reads from (request.jwt.claims->>'sub') plus the `authenticated` role.

create extension if not exists pgtap with schema extensions;
create schema if not exists tests;

create or replace function tests.act_as(p_user_id uuid)
returns void
language sql
as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
$$;

begin;
select plan(9);

-- ---------------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------------

insert into auth.users (id, email, is_anonymous) values
  ('00000000-0000-0000-0000-000000000001', 'alice@example.com', false),
  ('00000000-0000-0000-0000-000000000002', 'bob@example.com', false),
  ('00000000-0000-0000-0000-000000000003', 'carol-admin@example.com', false);

insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-000000000003', 'admin');

-- ---------------------------------------------------------------------------
-- 1-3: Private journal entries are invisible to everyone except the owner,
-- including an admin.
-- ---------------------------------------------------------------------------

select tests.act_as('00000000-0000-0000-0000-000000000001');
set local role authenticated;

insert into public.journal_entries (user_id, title, content)
values ('00000000-0000-0000-0000-000000000001', 'A hard morning', 'Some private thoughts.');

select is(
  (select count(*) from public.journal_entries)::int,
  1,
  'Alice can see her own journal entry'
);

select tests.act_as('00000000-0000-0000-0000-000000000002');

select is(
  (select count(*) from public.journal_entries)::int,
  0,
  'Bob cannot see Alice''s journal entry'
);

select tests.act_as('00000000-0000-0000-0000-000000000003');

select is(
  (select count(*) from public.journal_entries)::int,
  0,
  'An admin cannot see Alice''s journal entry either — no moderator bypass exists for journals'
);

-- ---------------------------------------------------------------------------
-- 4-6: A blocked user cannot start a new conversation with the blocker.
-- ---------------------------------------------------------------------------

select tests.act_as('00000000-0000-0000-0000-000000000001');

insert into public.blocks (blocker_id, blocked_id)
values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

select is(
  (select count(*) from public.blocks)::int,
  1,
  'Alice can block Bob'
);

select tests.act_as('00000000-0000-0000-0000-000000000002');

select throws_ok(
  $$ select public.start_conversation('00000000-0000-0000-0000-000000000001', 'hey') $$,
  'Messaging is not available between these users',
  'Bob cannot start a conversation with Alice after being blocked'
);

select is(
  (select count(*) from public.blocks)::int,
  0,
  'Bob cannot see that Alice blocked him (blocks are one-directional in SELECT)'
);

-- ---------------------------------------------------------------------------
-- 7-9: Guest token recovery only works with the exact token.
-- ---------------------------------------------------------------------------

select tests.act_as('00000000-0000-0000-0000-000000000002');

insert into public.stories (id, author_id, title, content, status, is_guest_authored)
values (
  '00000000-0000-0000-0000-00000000aaaa',
  '00000000-0000-0000-0000-000000000002',
  'A guest-authored story about starting over',
  repeat('This is a guest story body long enough to pass validation. ', 3),
  'draft',
  true
);

select results_eq(
  $$ select public.issue_guest_token('00000000-0000-0000-0000-00000000aaaa') is not null $$,
  $$ values (true) $$,
  'A guest token can be issued for the guest''s own story'
);

select tests.act_as('00000000-0000-0000-0000-000000000003');

select is(
  public.claim_guest_story('00000000-0000-0000-0000-00000000aaaa', 'not-the-real-token'),
  false,
  'Claiming a guest story with the wrong token fails'
);

select is(
  (select author_id from public.stories where id = '00000000-0000-0000-0000-00000000aaaa'),
  '00000000-0000-0000-0000-000000000002'::uuid,
  'A failed claim attempt does not change the story''s author'
);

select * from finish();
rollback;

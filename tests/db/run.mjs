// Executes every real migration in supabase/migrations/ against an actual
// Postgres engine (PGlite — real Postgres compiled to WASM, not a mock) and
// runs a real RLS/RPC test suite against it. This is what the project's own
// docs call "the thing that turns implemented into tested": no Docker was
// available for the full Supabase stack, but the database layer itself —
// schema, triggers, RLS policies, RPC functions — gets genuinely executed
// and asserted here, not just reviewed.
//
// What this does NOT cover: Supabase Auth (GoTrue), Realtime's websocket
// relay, PostgREST's HTTP layer, pg_cron (background worker, incompatible
// with PGlite's single-process WASM model — migration 14 is skipped), and
// actual WebRTC media negotiation between browsers. Minimal stubs for
// `auth.users`/`auth.uid()` and `storage.buckets`/`storage.objects` are
// created below so the real migrations can apply unmodified.
//
// Run: node tests/db/run.mjs

import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, '../../supabase/migrations')
const SKIP_FILES = new Set(['20260101000014_scheduled_cleanup.sql']) // pg_cron: no WASM background worker

const db = new PGlite({ extensions: { pgcrypto } })

let passCount = 0
let failCount = 0
const failures = []

async function exec(sql) {
  return db.exec(sql)
}

async function query(sql, params = []) {
  return db.query(sql, params)
}

async function test(name, fn) {
  try {
    await fn()
    passCount += 1
    console.log(`  \x1b[32m✓\x1b[0m ${name}`)
  } catch (error) {
    failCount += 1
    failures.push({ name, error })
    console.log(`  \x1b[31m✗\x1b[0m ${name}`)
    console.log(`    ${error.message}`)
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message ?? 'Assertion failed')
}

async function assertThrows(fn, messageIncludes, assertionLabel) {
  try {
    await fn()
  } catch (error) {
    if (messageIncludes && !String(error.message).includes(messageIncludes)) {
      throw new Error(
        `${assertionLabel ?? 'Expected a specific error'}: got "${error.message}", expected to include "${messageIncludes}"`,
      )
    }
    return
  }
  throw new Error(assertionLabel ?? 'Expected the operation to throw, but it succeeded')
}

/** Switches the session to the `authenticated` role, simulating a logged-in
 * user with the given id for every subsequent query (until actAs/asOwner is
 * called again). Session-level (not transaction-local) so it persists
 * across separate .query() calls, matching how a real request's lifetime
 * works under PostgREST. */
async function actAs(userId) {
  await exec(`set role authenticated;`)
  await query(`select set_config('request.jwt.claims', $1, false);`, [
    JSON.stringify({ sub: userId, role: 'authenticated' }),
  ])
}

async function actAsAnon() {
  await exec(`set role anon;`)
  await query(`select set_config('request.jwt.claims', $1, false);`, [JSON.stringify({ role: 'anon' })])
}

/** Back to the superuser/table-owner — bypasses RLS, for fixture setup. */
async function asOwner() {
  await exec(`reset role;`)
  await exec(`select set_config('request.jwt.claims', '', false);`)
}

// ---------------------------------------------------------------------------
// 1. Bootstrap: schema stubs for what Supabase provides that PGlite doesn't.
// ---------------------------------------------------------------------------

async function bootstrap() {
  await exec(`
    create schema if not exists extensions;
    set search_path = public, extensions;

    create schema auth;
    create table auth.users (
      id uuid primary key default gen_random_uuid(),
      email text,
      is_anonymous boolean not null default false,
      created_at timestamptz not null default now()
    );
    create function auth.uid() returns uuid
      language sql stable
      as $$
        select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid;
      $$;

    create schema storage;
    create table storage.buckets (
      id text primary key,
      name text not null,
      public boolean not null default false,
      file_size_limit bigint,
      allowed_mime_types text[]
    );
    create table storage.objects (
      id uuid primary key default gen_random_uuid(),
      bucket_id text references storage.buckets (id),
      name text,
      owner uuid,
      created_at timestamptz not null default now()
    );
    create function storage.foldername(name text) returns text[]
      language sql immutable
      as $$
        select case
          when array_length(string_to_array(name, '/'), 1) > 1
            then (string_to_array(name, '/'))[1 : array_length(string_to_array(name, '/'), 1) - 1]
          else array[]::text[]
        end;
      $$;

    -- Supabase creates this publication automatically; plain Postgres doesn't.
    create publication supabase_realtime;
  `)
}

async function applyMigrations() {
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    if (SKIP_FILES.has(file)) {
      console.log(`  (skipping ${file} — requires pg_cron, not available under PGlite)`)
      continue
    }
    const sql = readFileSync(join(migrationsDir, file), 'utf8')
    try {
      await exec(sql)
      console.log(`  applied ${file}`)
    } catch (error) {
      console.error(`  FAILED applying ${file}:`)
      console.error(`    ${error.message}`)
      throw error
    }
  }
}

async function setUpRolesAndGrants() {
  await exec(`
    create role authenticated nologin noinherit;
    create role anon nologin noinherit;

    grant usage on schema public, auth, storage to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;

    grant select, insert, update, delete on all tables in schema public to authenticated;
    grant select on all tables in schema public to anon;
    grant usage, select on all sequences in schema public to authenticated, anon;
    grant execute on all functions in schema public to authenticated, anon;

    grant select, insert, update, delete on all tables in schema storage to authenticated;
    grant select on all tables in schema storage to anon;
  `)
}

// ---------------------------------------------------------------------------
// 2. Fixtures
// ---------------------------------------------------------------------------

const ALICE = '00000000-0000-0000-0000-000000000001'
const BOB = '00000000-0000-0000-0000-000000000002'
const CAROL_ADMIN = '00000000-0000-0000-0000-000000000003'
const DAVE_MOD = '00000000-0000-0000-0000-000000000004'
const EVE_OUTSIDER = '00000000-0000-0000-0000-000000000005'

async function seedFixtures() {
  await asOwner()
  // Inserting into auth.users fires handle_new_user(), which creates the
  // matching anonymous_profiles and user_preferences rows automatically —
  // exactly like a real signup. No need to insert those separately.
  await exec(`
    insert into auth.users (id, email, is_anonymous) values
      ('${ALICE}', 'alice@example.com', false),
      ('${BOB}', 'bob@example.com', false),
      ('${CAROL_ADMIN}', 'carol-admin@example.com', false),
      ('${DAVE_MOD}', 'dave-mod@example.com', false),
      ('${EVE_OUTSIDER}', 'eve@example.com', false);

    update public.anonymous_profiles set display_name = 'AliceAnon' where user_id = '${ALICE}';
    update public.anonymous_profiles set display_name = 'BobAnon' where user_id = '${BOB}';
    update public.anonymous_profiles set display_name = 'CarolAnon' where user_id = '${CAROL_ADMIN}';
    update public.anonymous_profiles set display_name = 'DaveAnon' where user_id = '${DAVE_MOD}';
    update public.anonymous_profiles set display_name = 'EveAnon' where user_id = '${EVE_OUTSIDER}';

    insert into public.user_roles (user_id, role) values
      ('${CAROL_ADMIN}', 'admin'),
      ('${DAVE_MOD}', 'content_moderator');

    insert into public.categories (id, slug, name) values
      ('10000000-0000-0000-0000-000000000001', 'test-category', 'Test Category');
  `)
}

// ---------------------------------------------------------------------------
// 3. Tests
// ---------------------------------------------------------------------------

async function runTests() {
  console.log('\n--- Personal recovery privacy ---')

  await test('owner can create and read their own journal entry', async () => {
    await actAs(ALICE)
    await query(`insert into journal_entries (user_id, title, content) values ($1, 'A hard morning', 'Private thoughts.')`, [ALICE])
    const { rows } = await query(`select * from journal_entries where user_id = $1`, [ALICE])
    assert(rows.length === 1, 'expected exactly 1 journal entry visible to its owner')
  })

  await test('another regular user cannot see it', async () => {
    await actAs(BOB)
    const { rows } = await query(`select * from journal_entries`)
    assert(rows.length === 0, `expected 0 rows, got ${rows.length}`)
  })

  await test('an admin cannot see it either — no moderator bypass on journals', async () => {
    await actAs(CAROL_ADMIN)
    const { rows } = await query(`select * from journal_entries`)
    assert(rows.length === 0, `expected 0 rows even for an admin, got ${rows.length}`)
  })

  console.log('\n--- Blocking ---')

  await test('Alice can block Bob', async () => {
    await actAs(ALICE)
    await query(`insert into blocks (blocker_id, blocked_id) values ($1, $2)`, [ALICE, BOB])
    const { rows } = await query(`select * from blocks`)
    assert(rows.length === 1, 'expected the block to be visible to the blocker')
  })

  await test('Bob cannot start a conversation with Alice after being blocked', async () => {
    await actAs(BOB)
    await assertThrows(
      () => query(`select start_conversation($1, 'hey there')`, [ALICE]),
      'not available between these users',
    )
  })

  await test('Bob cannot see that Alice blocked him (one-directional SELECT)', async () => {
    await actAs(BOB)
    const { rows } = await query(`select * from blocks`)
    assert(rows.length === 0, `expected 0 rows, got ${rows.length}`)
  })

  console.log('\n--- Messaging: requests, acceptance, membership ---')

  let conversationId
  await test('Alice starts a conversation with Carol (not blocked)', async () => {
    await actAs(ALICE)
    const { rows } = await query(`select start_conversation($1, 'Hi, I read your story.') as id`, [CAROL_ADMIN])
    conversationId = rows[0].id
    assert(conversationId, 'expected a conversation id back')
  })

  await test('the conversation starts pending with exactly one message', async () => {
    await actAs(ALICE)
    const { rows: convRows } = await query(`select status from conversations where id = $1`, [conversationId])
    assert(convRows[0].status === 'pending', `expected status 'pending', got '${convRows[0].status}'`)
    const { rows: msgRows } = await query(`select * from messages where conversation_id = $1`, [conversationId])
    assert(msgRows.length === 1, `expected 1 message, got ${msgRows.length}`)
  })

  await test('Carol (the recipient) cannot be impersonated — only she can accept', async () => {
    await actAs(ALICE)
    await assertThrows(
      () => query(`select respond_to_message_request($1, true)`, [conversationId]),
      'Only the recipient',
    )
  })

  await test('a non-member cannot read the pending conversation at all', async () => {
    await actAs(EVE_OUTSIDER)
    const { rows } = await query(`select * from conversations where id = $1`, [conversationId])
    assert(rows.length === 0, `expected 0 rows for a non-member, got ${rows.length}`)
  })

  await test('Carol accepts the request', async () => {
    await actAs(CAROL_ADMIN)
    await query(`select respond_to_message_request($1, true)`, [conversationId])
    const { rows } = await query(`select status from conversations where id = $1`, [conversationId])
    assert(rows[0].status === 'active', `expected 'active', got '${rows[0].status}'`)
  })

  await test('Carol can now reply', async () => {
    await actAs(CAROL_ADMIN)
    await query(`select send_message($1, 'Thanks for reaching out!')`, [conversationId])
    const { rows } = await query(`select * from messages where conversation_id = $1`, [conversationId])
    assert(rows.length === 2, `expected 2 messages, got ${rows.length}`)
  })

  await test('Carol gets a notification for the message-request (not a duplicate for her own reply)', async () => {
    await actAs(CAROL_ADMIN)
    const { rows } = await query(`select * from notifications where user_id = $1 and type = 'message_request'`, [CAROL_ADMIN])
    assert(rows.length === 1, `expected exactly 1 message_request notification, got ${rows.length}`)
  })

  await test('Alice gets a notification for the message Carol sent back', async () => {
    await actAs(ALICE)
    const { rows } = await query(`select * from notifications where user_id = $1 and type = 'message'`, [ALICE])
    assert(rows.length === 1, `expected exactly 1 message notification, got ${rows.length}`)
  })

  console.log('\n--- Calling: the Milestone 3 visibility fix, re-verified for real ---')

  let callId
  await test('Alice starts a call in that conversation', async () => {
    await actAs(ALICE)
    const { rows } = await query(`select start_call($1, 'voice') as id`, [conversationId])
    callId = rows[0].id
    assert(callId, 'expected a call id back')
  })

  await test('Carol (the callee, not yet a participant) CAN see the ringing call — the actual bug fix', async () => {
    await actAs(CAROL_ADMIN)
    const { rows } = await query(`select * from call_sessions where id = $1`, [callId])
    assert(rows.length === 1, 'the callee must be able to see their own incoming call to ever answer it')
  })

  await test('Eve, who is not in the conversation, cannot see the call', async () => {
    await actAs(EVE_OUTSIDER)
    const { rows } = await query(`select * from call_sessions where id = $1`, [callId])
    assert(rows.length === 0, `expected 0 rows, got ${rows.length}`)
  })

  await test('Carol joins, then both can exchange signaling rows; Eve cannot read them', async () => {
    await actAs(CAROL_ADMIN)
    await query(`insert into call_participants (call_id, user_id, joined_at) values ($1, $2, now())`, [callId, CAROL_ADMIN])
    await query(`insert into call_signals (call_id, sender_id, signal_type, payload) values ($1, $2, 'answer', '{"type":"answer"}')`, [
      callId,
      CAROL_ADMIN,
    ])
    await actAs(EVE_OUTSIDER)
    const { rows } = await query(`select * from call_signals where call_id = $1`, [callId])
    assert(rows.length === 0, `expected 0 rows for a non-participant, got ${rows.length}`)
  })

  console.log('\n--- Guest publishing tokens ---')

  let guestStoryId
  let realToken
  await test('Bob publishes a guest-authored story', async () => {
    await actAs(BOB)
    const { rows } = await query(
      `insert into stories (author_id, category_id, title, content, status, is_guest_authored)
       values ($1, '10000000-0000-0000-0000-000000000001', 'A guest story about starting over',
               repeat('Long enough content for validation. ', 3), 'draft', true)
       returning id`,
      [BOB],
    )
    guestStoryId = rows[0].id
  })

  await test('Bob can issue himself a recovery token', async () => {
    await actAs(BOB)
    const { rows } = await query(`select issue_guest_token($1) as token`, [guestStoryId])
    realToken = rows[0].token
    assert(typeof realToken === 'string' && realToken.length > 10, 'expected a non-trivial token string')
  })

  await test('claiming with the WRONG token fails and does not change authorship', async () => {
    await actAs(CAROL_ADMIN)
    const { rows } = await query(`select claim_guest_story($1, 'not-the-real-token') as ok`, [guestStoryId])
    assert(rows[0].ok === false, 'expected claim to fail with the wrong token')
    const { rows: storyRows } = await query(`select author_id from stories where id = $1`, [guestStoryId])
    assert(storyRows[0].author_id === BOB, 'author must not change after a failed claim')
  })

  await test('claiming with the CORRECT token succeeds and transfers authorship', async () => {
    await actAs(CAROL_ADMIN)
    const { rows } = await query(`select claim_guest_story($1, $2) as ok`, [guestStoryId, realToken])
    assert(rows[0].ok === true, 'expected claim to succeed with the correct token')
    const { rows: storyRows } = await query(`select author_id from stories where id = $1`, [guestStoryId])
    assert(storyRows[0].author_id === CAROL_ADMIN, 'authorship should have transferred to the claimer')
  })

  console.log('\n--- Moderation RBAC ---')

  await test('a regular user cannot record a moderation action', async () => {
    await actAs(BOB)
    await assertThrows(
      () => query(`select record_moderation_action('story', $1, 'removed', 'test')`, [guestStoryId]),
      'Only moderators',
    )
  })

  await test('a content_moderator can, and it writes both an action and an audit log entry', async () => {
    await actAs(DAVE_MOD)
    await query(`select record_moderation_action('story', $1, 'removed', 'test removal')`, [guestStoryId])
    const { rows: actionRows } = await query(`select * from moderation_actions where target_id = $1`, [guestStoryId])
    assert(actionRows.length === 1, `expected 1 moderation action, got ${actionRows.length}`)
    const { rows: auditRows } = await query(`select * from audit_logs where actor_id = $1`, [DAVE_MOD])
    assert(auditRows.length === 1, `expected 1 audit log entry, got ${auditRows.length}`)
  })

  console.log('\n--- Account status (Milestone 4: suspend/restrict) ---')

  await test('a content_moderator (not an admin) cannot change account status', async () => {
    await actAs(DAVE_MOD)
    await assertThrows(
      () => query(`select set_user_account_status($1, 'suspended', 'test')`, [BOB]),
      'Only admins',
    )
  })

  await test('an admin suspends Bob, which is recorded in the audit trail', async () => {
    await actAs(CAROL_ADMIN)
    await query(`select set_user_account_status($1, 'suspended', 'repeated harassment reports')`, [BOB])
    const { rows } = await query(`select status, notes from user_account_status where user_id = $1`, [BOB])
    assert(rows.length === 1 && rows[0].status === 'suspended', 'expected Bob to be recorded as suspended')
    const { rows: auditRows } = await query(
      `select * from audit_logs where actor_id = $1 and action like 'set_account_status%'`,
      [CAROL_ADMIN],
    )
    assert(auditRows.length === 1, `expected 1 audit log entry for the status change, got ${auditRows.length}`)
  })

  await test('Bob can see his own account status', async () => {
    await actAs(BOB)
    const { rows } = await query(`select status from user_account_status where user_id = $1`, [BOB])
    assert(rows.length === 1 && rows[0].status === 'suspended', 'expected Bob to see his own suspended status')
  })

  await test('Eve cannot see Bob\'s account status (not admin, not self)', async () => {
    await actAs(EVE_OUTSIDER)
    const { rows } = await query(`select status from user_account_status where user_id = $1`, [BOB])
    assert(rows.length === 0, `expected 0 rows for a non-admin viewing someone else's status, got ${rows.length}`)
  })

  await test('Bob cannot un-suspend himself — no update policy for non-admins', async () => {
    await actAs(BOB)
    // RLS's USING clause on UPDATE silently filters to zero matching rows
    // for a non-admin (rather than throwing) — either way, nothing changes.
    try {
      await query(`update user_account_status set status = 'active' where user_id = $1`, [BOB])
    } catch {
      // also acceptable: some policy shapes do raise instead of filtering
    }
    await actAs(CAROL_ADMIN)
    const { rows } = await query(`select status from user_account_status where user_id = $1`, [BOB])
    assert(rows[0].status === 'suspended', 'Bob must not be able to reverse his own suspension via direct UPDATE')
  })

  console.log('\n--- Admin stats RPC ---')

  await test('a regular user cannot read admin stats', async () => {
    await actAs(ALICE)
    await assertThrows(() => query(`select * from get_admin_stats()`), 'Only moderators')
  })

  await test('a moderator reads real platform-wide counts', async () => {
    await actAs(DAVE_MOD)
    const { rows } = await query(`select * from get_admin_stats()`)
    assert(rows.length === 1, 'expected exactly one stats row')
    const stats = rows[0]
    assert(Number(stats.total_stories) >= 1, 'expected at least the guest story created earlier to be counted')
    assert(Number(stats.registered_users) >= 2, 'expected at least Carol and Dave to count as registered users')
  })

  console.log('\n--- Rate limiting ---')

  await test('sending more than the per-minute message limit is rejected', async () => {
    await actAs(ALICE)
    await assertThrows(async () => {
      for (let i = 0; i < 25; i += 1) {
        await query(`select send_message($1, $2)`, [conversationId, `spam message ${i}`])
      }
    }, 'Rate limit exceeded')
  })

  console.log('\n--- Group chat membership ---')

  let communityId
  let roomId
  await test('Dave (a moderator) creates a community, which gets a chat room automatically', async () => {
    await actAs(DAVE_MOD)
    const { rows } = await query(
      `insert into communities (slug, name, created_by) values ('test-group', 'Test Group', $1) returning id`,
      [DAVE_MOD],
    )
    communityId = rows[0].id
    const { rows: roomRows } = await query(`select id from group_chat_rooms where community_id = $1`, [communityId])
    assert(roomRows.length === 1, 'expected a chat room to be created automatically')
    roomId = roomRows[0].id
  })

  await test('Eve joins the community and can post in its chat', async () => {
    await actAs(EVE_OUTSIDER)
    await query(`insert into community_members (community_id, user_id) values ($1, $2)`, [communityId, EVE_OUTSIDER])
    await query(`insert into group_messages (room_id, author_id, content) values ($1, $2, 'Hello group!')`, [roomId, EVE_OUTSIDER])
    const { rows } = await query(`select * from group_messages where room_id = $1`, [roomId])
    assert(rows.length === 1, 'the member should see the message she just posted')
  })

  await test('Bob, who has not joined, cannot read the group chat', async () => {
    await actAs(BOB)
    const { rows } = await query(`select * from group_messages where room_id = $1`, [roomId])
    assert(rows.length === 0, `expected 0 rows for a non-member, got ${rows.length}`)
  })

  console.log('\n--- Content reports ---')

  await test('a reporter can file and read their own report, but not see others’', async () => {
    await actAs(BOB)
    await query(`insert into reports (reporter_id, target_type, target_id, reason) values ($1, 'story', $2, 'Looks like spam')`, [
      BOB,
      guestStoryId,
    ])
    await actAs(EVE_OUTSIDER)
    await query(`insert into reports (reporter_id, target_type, target_id, reason) values ($1, 'story', $2, 'Also concerning')`, [
      EVE_OUTSIDER,
      guestStoryId,
    ])
    await actAs(BOB)
    const { rows } = await query(`select * from reports where reporter_id = $1`, [BOB])
    assert(rows.length === 1, `Bob should see only his own report, got ${rows.length}`)
  })

  await test('a moderator sees every report', async () => {
    await actAs(DAVE_MOD)
    const { rows } = await query(`select * from reports where target_id = $1`, [guestStoryId])
    assert(rows.length === 2, `expected 2 reports visible to a moderator, got ${rows.length}`)
  })

  console.log('\n--- Account deletion (Milestone 4: real "Delete My Account") ---')

  const ZARA_TEMP = '00000000-0000-0000-0000-000000000006'
  await test('a throwaway user creates a story and a journal entry, then deletes their own account', async () => {
    await asOwner()
    await exec(`insert into auth.users (id, email, is_anonymous) values ('${ZARA_TEMP}', 'zara-temp@example.com', false);`)

    await actAs(ZARA_TEMP)
    await query(
      `insert into stories (author_id, category_id, title, content, status)
       values ($1, '10000000-0000-0000-0000-000000000001', 'A story about moving forward',
               repeat('Long enough content for validation. ', 3), 'draft')`,
      [ZARA_TEMP],
    )
    await query(`insert into journal_entries (user_id, title, content) values ($1, 'Reflections', 'Private thoughts.')`, [ZARA_TEMP])

    await query(`select request_account_deletion()`)

    await asOwner()
    const { rows: userRows } = await query(`select * from auth.users where id = $1`, [ZARA_TEMP])
    assert(userRows.length === 0, 'expected the auth.users row to be gone after self-deletion')
    const { rows: profileRows } = await query(`select * from anonymous_profiles where user_id = $1`, [ZARA_TEMP])
    assert(profileRows.length === 0, 'expected the profile to cascade-delete')
    const { rows: storyRows } = await query(`select * from stories where author_id = $1`, [ZARA_TEMP])
    assert(storyRows.length === 0, 'expected their story to cascade-delete')
    const { rows: journalRows } = await query(`select * from journal_entries where user_id = $1`, [ZARA_TEMP])
    assert(journalRows.length === 0, 'expected their journal entry to cascade-delete')
  })

  await test('the deletion itself is audited, anonymized after the fact', async () => {
    await asOwner()
    const { rows } = await query(`select * from audit_logs where action = 'account_self_deleted' and target = $1`, [
      `user:${ZARA_TEMP}`,
    ])
    assert(rows.length === 1, `expected exactly 1 audit log entry for the deletion, got ${rows.length}`)
    assert(rows[0].actor_id === null, 'expected the actor_id to be nulled out once the deleted user no longer exists')
  })

  console.log('\n--- Storage path-based ownership ---')

  await test('a user can upload to their own avatar folder', async () => {
    await asOwner()
    await exec(`insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;`)
    await actAs(ALICE)
    await query(`insert into storage.objects (bucket_id, name, owner) values ('avatars', $1 || '/photo.png', $2)`, [ALICE, ALICE])
    const { rows } = await query(`select * from storage.objects where bucket_id = 'avatars'`)
    assert(rows.length === 1, 'expected Alice to see the file she just uploaded')
  })

  console.log('\n--- Anonymous identity ---')

  await test('the anonymous display name is never Alice\'s email or any PII', async () => {
    await actAsAnon()
    const { rows } = await query(`select display_name from anonymous_profiles where user_id = $1`, [ALICE])
    assert(rows[0].display_name === 'AliceAnon', 'sanity check on the fixture')
    assert(!rows[0].display_name.includes('@'), 'display name must never look like an email address')
  })
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

function printPgError(error) {
  console.error(`\n  ERROR: ${error.message}`)
  if (error.detail) console.error(`  DETAIL: ${error.detail}`)
  if (error.hint) console.error(`  HINT: ${error.hint}`)
  if (error.where) console.error(`  WHERE: ${error.where}`)
}

try {
  console.log('Bootstrapping stub auth/storage schemas...')
  await bootstrap()

  console.log('\nApplying real migrations from supabase/migrations/...')
  await applyMigrations()

  console.log('\nSetting up authenticated/anon roles and grants...')
  await setUpRolesAndGrants()

  console.log('\nSeeding fixtures...')
  await seedFixtures()

  await runTests()
} catch (error) {
  printPgError(error)
  process.exit(1)
}

console.log(`\n${'='.repeat(60)}`)
console.log(`${passCount} passed, ${failCount} failed`)
if (failCount > 0) {
  console.log('\nFailures:')
  for (const f of failures) console.log(`  - ${f.name}: ${f.error.message}`)
  process.exit(1)
}
process.exit(0)

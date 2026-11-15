# Messaging & Calling Architecture

## Private Messaging

- A conversation starts via the `start_conversation(recipient_id, first_message)` RPC
  (`SECURITY DEFINER`), which atomically: checks neither side has blocked the other,
  checks the recipient allows messages, inserts the `conversations` row as `pending`,
  inserts both `conversation_members` rows, and inserts the first message. Doing this as
  one function call avoids a window where a client could insert a membership row for
  someone else, or end up with a conversation that has only one member.
- `respond_to_message_request(conversation_id, accept)` is the only way a conversation
  moves from `pending` to `active` or `declined` — and only the recipient can call it.
- `send_message(conversation_id, content)` re-checks membership and status server-side
  on every message (not just at conversation creation), so a conversation that gets
  declined or a user who gets blocked mid-conversation can't keep sending.
- Live updates: `src/services/messaging.service.ts` subscribes to Postgres Changes on
  `messages` filtered by `conversation_id`. `conversations` and `messages` are both in
  the `supabase_realtime` publication (`20260101000015_notification_triggers.sql`).
- Rate limiting: a generic trigger (`20260101000016_rate_limiting.sql`) caps new
  conversations and messages per user per time window, independent of anything the
  frontend enforces.

## Group Chat

Structurally identical to private messaging but simpler: every `communities` row gets
exactly one `group_chat_rooms` row (via trigger), and any `community_members` row can
read/post in it — see `docs/DATABASE_SCHEMA.md` for why `group_chat_members` doesn't
exist as a separate table. Live updates follow the same Postgres Changes pattern,
scoped to `room_id`.

## Voice & Video Calling

This is real WebRTC — `getUserMedia` + `RTCPeerConnection`, not a prototype — signaled
through the `call_signals` table rather than a separate signaling server:

1. The caller calls `start_call(conversation_id, type)`, which creates a `call_sessions`
   row (`status = 'ringing'`) and adds the caller as the first `call_participants` row.
2. **Every member of that conversation** can see the new `call_sessions` row in real
   time (via `IncomingCallListener`, mounted once in `DashboardLayout`) — this required
   fixing the original RLS policy; see the "A real bug found" note in
   `docs/DATABASE_SCHEMA.md`.
3. The callee gets an in-app dialog requiring explicit Accept/Decline — there is no path
   that starts a call without this step, satisfying the non-negotiable "no unsolicited
   calls" requirement.
4. On accept, both sides' browsers create an `RTCPeerConnection` (`src/hooks/useWebRTCCall.ts`)
   and exchange offer/answer/ICE candidates as rows in `call_signals`, read via a
   Postgres Changes subscription filtered by `call_id`. ICE candidates that arrive
   before the remote description is set are queued and drained afterward — a common
   WebRTC race condition.
5. `call_signals` rows are cleaned up by a pg_cron job every 10 minutes
   (`cleanup_stale_call_signals()`) — they're only ever needed for the few seconds of
   connection negotiation.

### STUN/TURN — a real, documented limitation

The only ICE server configured is Google's public STUN
(`stun:stun.l.google.com:19302`), in `src/services/calling.service.ts`. STUN is enough
for most home/mobile networks to discover a usable public address, but it **cannot
relay media** when both peers are behind a symmetric NAT or a restrictive corporate
firewall — that requires a TURN server, which this project does not run. Concretely:
some fraction of calls between two "difficult" networks will fail to connect, and the
UI should treat that as an expected, explainable outcome, not a bug to chase. Twilio,
Cloudflare Calls, and Xirsys all offer pay-as-you-go TURN if production call
reliability turns out to need it — per Rule 5 (cost control), that's a deliberate
future decision for whoever runs this in production, not something added silently here.

### What's real vs. simulated right now

- **Real and verified against real Postgres** (`tests/db/run.mjs`): the signaling
  schema and RLS — specifically, that the callee can see a ringing call they haven't
  joined yet (the Milestone 3 fix), that both participants can read/write
  `call_signals` once joined, and that an outsider to the conversation can't read any
  of it.
- **Real and verified at the browser level** (`tests/e2e/webrtc-mechanics.spec.ts`):
  the actual negotiation code — `getUserMedia`, `RTCPeerConnection`, offer/answer
  exchange, ICE candidate exchange (including the "candidate arrives before remote
  description is set" race, via the same pending-candidates queue
  `useWebRTCCall` uses), both peers reaching `connected`, and both firing `ontrack` for
  real audio/video media — all run for real in two Chromium browser contexts with fake
  camera/mic devices. The test deliberately swaps only the signaling *transport*:
  instead of Supabase Realtime (no live project exists in this sandbox), signals are
  relayed directly between the two browser contexts via Playwright's
  `exposeFunction`. The peer-connection logic under test is the same code path the app
  uses, not a mock of it.
- **Still not verified in this sandbox**: an actual call placed between two real users
  through a live Supabase project, over real networks, through real STUN — the test
  above proves the negotiation code works, not that it works across the public
  internet with Supabase Realtime as the transport and real NAT in the way. See
  `docs/SECURITY.md` for how this is scoped.
- In mock mode (no Supabase configured), `CallInterfacePage` still shows the original
  Milestone 1 simulated UI (a "Simulate Accept" button) — real WebRTC only activates
  once a backend is connected.

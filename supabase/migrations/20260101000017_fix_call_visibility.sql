-- Fixes a real bug found while wiring the frontend calling UI in Milestone 3:
-- the original "Participants read their own call sessions" policy
-- (20260101000006_calling.sql) only allowed the caller or an already-joined
-- call_participants row to SELECT a call_sessions row. The callee is never
-- a participant until *after* they join — so they could never see an
-- incoming ringing call in the first place, and the frontend's "incoming
-- call" listener would never fire. Fixed by also allowing any member of the
-- underlying conversation to see its call sessions, which is no more
-- permissive than what they can already see (they can already read every
-- message in that same conversation).

drop policy "Participants read their own call sessions" on public.call_sessions;

create policy "Conversation members see call sessions in their own conversation"
  on public.call_sessions for select
  using (
    caller_id = auth.uid()
    or exists (
      select 1 from public.call_participants cp
      where cp.call_id = call_sessions.id and cp.user_id = auth.uid()
    )
    or exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = call_sessions.conversation_id and cm.user_id = auth.uid()
    )
  );

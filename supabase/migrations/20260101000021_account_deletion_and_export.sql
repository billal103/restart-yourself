-- Real account deletion, backing the "Delete My Account" button that has
-- existed since Milestone 1 (src/pages/dashboard/PrivacySettingsPage.tsx)
-- without ever calling anything. The schema was already deliberately
-- designed for this: every ownership foreign key cascades (anonymous_profiles,
-- stories, comments, journal_entries, messages, ...), while every
-- accountability-record foreign key (moderation_actions.moderator_id,
-- audit_logs.actor_id, reports.reporter_id, ...) sets null instead — so
-- deleting a user cleanly removes everything they own while leaving the
-- moderation/audit trail intact but anonymized, matching
-- docs/DATA_RETENTION_POLICY.md.

create function public.request_account_deletion()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not signed in';
  end if;

  -- Record the deletion itself before the actor_id it would reference is
  -- gone — a self-service deletion is still an auditable event.
  insert into public.audit_logs (actor_id, action, target)
  values (v_user_id, 'account_self_deleted', 'user:' || v_user_id);

  delete from auth.users where id = v_user_id;
end;
$$;

comment on function public.request_account_deletion() is
  'Deletes the calling user''s auth.users row. Every table that stores their own content cascades; moderation/audit records about them are kept but anonymized (actor/reporter set to null) — see docs/DATA_RETENTION_POLICY.md.';

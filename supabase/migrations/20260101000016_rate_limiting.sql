-- Basic spam/abuse rate limiting (spec 3.4/3.8: "Apply rate limits to
-- prevent spam"). Generic trigger so the same function backs every table
-- that needs a limit, parameterized via trigger arguments:
--   TG_ARGV[0] = user id column name
--   TG_ARGV[1] = max inserts allowed
--   TG_ARGV[2] = window, as an interval literal string (e.g. '1 minute')

create function public.enforce_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_column text := TG_ARGV[0];
  v_max_count int := TG_ARGV[1]::int;
  v_window interval := TG_ARGV[2]::interval;
  v_user_id uuid;
  v_recent_count int;
begin
  execute format('select ($1).%I', v_user_column) into v_user_id using new;

  execute format(
    'select count(*) from %I.%I where %I = $1 and created_at > now() - $2',
    TG_TABLE_SCHEMA, TG_TABLE_NAME, v_user_column
  )
  into v_recent_count
  using v_user_id, v_window;

  if v_recent_count >= v_max_count then
    raise exception 'Rate limit exceeded: too many % in %', TG_TABLE_NAME, v_window
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger rate_limit_messages
  before insert on public.messages
  for each row execute function public.enforce_rate_limit('sender_id', '20', '1 minute');

create trigger rate_limit_comments
  before insert on public.comments
  for each row execute function public.enforce_rate_limit('author_id', '10', '1 minute');

create trigger rate_limit_group_messages
  before insert on public.group_messages
  for each row execute function public.enforce_rate_limit('author_id', '20', '1 minute');

create trigger rate_limit_reports
  before insert on public.reports
  for each row execute function public.enforce_rate_limit('reporter_id', '5', '10 minutes');

create trigger rate_limit_communication_reports
  before insert on public.communication_reports
  for each row execute function public.enforce_rate_limit('reporter_id', '5', '10 minutes');

create trigger rate_limit_conversations
  before insert on public.conversations
  for each row execute function public.enforce_rate_limit('initiated_by', '10', '10 minutes');

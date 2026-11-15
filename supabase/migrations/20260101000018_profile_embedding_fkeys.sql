-- PostgREST (what the JS client's .select() embedding uses) can only embed
-- across tables that share a direct foreign key — it can't infer a path
-- through a third table. `anonymous_profiles.user_id` and e.g.
-- `comments.author_id` both reference `auth.users.id` independently, which
-- isn't enough for `.select('*, anonymous_profiles(...)')` to work on
-- `comments`. Adding a second, explicitly-named FK straight to
-- `anonymous_profiles(user_id)` (safe: it's `unique`, and every auth.users
-- row gets one via the handle_new_user() trigger before any of these rows
-- can reference it) gives PostgREST that direct path without touching the
-- original auth.users FK or its cascade-delete behavior.

alter table public.comments
  add constraint comments_author_id_profile_fkey
  foreign key (author_id) references public.anonymous_profiles (user_id);

alter table public.group_messages
  add constraint group_messages_author_id_profile_fkey
  foreign key (author_id) references public.anonymous_profiles (user_id);

alter table public.conversation_members
  add constraint conversation_members_user_id_profile_fkey
  foreign key (user_id) references public.anonymous_profiles (user_id);

alter table public.community_members
  add constraint community_members_user_id_profile_fkey
  foreign key (user_id) references public.anonymous_profiles (user_id);

alter table public.blocks
  add constraint blocks_blocked_id_profile_fkey
  foreign key (blocked_id) references public.anonymous_profiles (user_id);

alter table public.stories
  add constraint stories_author_id_profile_fkey
  foreign key (author_id) references public.anonymous_profiles (user_id);

alter table public.messages
  add constraint messages_sender_id_profile_fkey
  foreign key (sender_id) references public.anonymous_profiles (user_id);

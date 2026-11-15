-- Storage buckets. Every path is namespaced "<user_id>/<filename>" so RLS can
-- check ownership from the path alone via storage.foldername(name).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp']),
  ('story-media', 'story-media', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('community-images', 'community-images', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('journal-attachments', 'journal-attachments', false, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
  ('professional-documents', 'professional-documents', false, 10485760, array['image/png', 'image/jpeg', 'application/pdf']);

-- avatars & story-media & community-images: public read, owner-only write.
create policy "Public read of avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Owners upload and manage their own avatar"
  on storage.objects for all
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Public read of story media"
  on storage.objects for select
  using (bucket_id = 'story-media');

create policy "Owners upload and manage their own story media"
  on storage.objects for all
  using (bucket_id = 'story-media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'story-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Public read of community images"
  on storage.objects for select
  using (bucket_id = 'community-images');

create policy "Moderators manage community images"
  on storage.objects for all
  using (bucket_id = 'community-images' and public.is_moderator())
  with check (bucket_id = 'community-images' and public.is_moderator());

-- journal-attachments: strictly private, owner-only. Never placed in a
-- public bucket, per the non-negotiable private-journal requirement.
create policy "Owners access their own journal attachments"
  on storage.objects for all
  using (bucket_id = 'journal-attachments' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'journal-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

-- professional-documents: private, owner uploads, moderators review.
create policy "Owners upload their own verification documents"
  on storage.objects for insert
  with check (bucket_id = 'professional-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Owners and moderators read verification documents"
  on storage.objects for select
  using (
    bucket_id = 'professional-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_moderator())
  );

create policy "Owners or moderators remove verification documents"
  on storage.objects for delete
  using (
    bucket_id = 'professional-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_moderator())
  );

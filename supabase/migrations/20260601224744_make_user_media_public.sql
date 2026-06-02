-- Fix "images disappear": the `user-media` bucket (avatars + wall/classifieds/
-- profile photos) was created privately in the dashboard and never marked
-- public, yet the app serves it via getPublicUrl(). The /object/public/ path
-- only returns bytes when the bucket's `public` flag is true (RLS does not gate
-- it). Sibling buckets 'groups'/'lost-found'/'events' are already public.
insert into storage.buckets (id, name, public)
values ('user-media', 'user-media', true)
on conflict (id) do update set public = true;

-- Normalize the contradictory SELECT policies left by earlier migrations
-- (one required auth.uid() IS NOT NULL, the other effectively allowed anon via
-- `name is not null`) into a single, clear public-read rule.
drop policy if exists "Public read for user-media" on storage.objects;
drop policy if exists "Public read individual files" on storage.objects;

create policy "user-media public read"
  on storage.objects for select
  using (bucket_id = 'user-media');

-- INSERT/UPDATE/DELETE policies from the original migration remain in force:
-- they require auth.uid()::text = (storage.foldername(name))[1], i.e. uploads
-- must live under a top-level folder named after the user's id. The avatar
-- upload path in EditProfile is updated to `<uid>/avatar.<ext>` to comply.

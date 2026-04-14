
CREATE POLICY "Public read for user-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-media');

CREATE POLICY "Auth users upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Auth users update own uploads"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Auth users delete own uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

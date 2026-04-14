
DROP POLICY IF EXISTS "Public read for user-media" ON storage.objects;

CREATE POLICY "Public read for user-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Public read individual files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-media' AND (CASE WHEN auth.uid() IS NULL THEN name IS NOT NULL ELSE true END));

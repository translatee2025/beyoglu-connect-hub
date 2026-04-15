
INSERT INTO storage.buckets (id, name, public) VALUES ('lost-found', 'lost-found', true);

CREATE POLICY "Anyone can view lost-found files"
ON storage.objects FOR SELECT
USING (bucket_id = 'lost-found');

CREATE POLICY "Auth users can upload lost-found files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'lost-found' AND auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can update own lost-found files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'lost-found' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Auth users can delete own lost-found files"
ON storage.objects FOR DELETE
USING (bucket_id = 'lost-found' AND auth.uid()::text = (storage.foldername(name))[1]);

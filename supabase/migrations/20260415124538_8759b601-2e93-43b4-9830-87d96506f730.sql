
INSERT INTO storage.buckets (id, name, public) VALUES ('events', 'events', true);

CREATE POLICY "Anyone can view event photos" ON storage.objects FOR SELECT USING (bucket_id = 'events');
CREATE POLICY "Auth users can upload event photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'events');
CREATE POLICY "Users can update own event photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own event photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1]);

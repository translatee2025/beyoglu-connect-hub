
-- Create groups storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('groups', 'groups', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view group photos
CREATE POLICY "Group photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'groups');

-- Auth users can upload group photos
CREATE POLICY "Auth users can upload group photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'groups' AND auth.uid() IS NOT NULL);

-- Auth users can update their uploads
CREATE POLICY "Auth users can update group photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'groups' AND auth.uid() IS NOT NULL);

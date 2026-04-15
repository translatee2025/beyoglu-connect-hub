
-- Add price columns to neighbor_help_posts
ALTER TABLE public.neighbor_help_posts ADD COLUMN IF NOT EXISTS price text;
ALTER TABLE public.neighbor_help_posts ADD COLUMN IF NOT EXISTS price_type text DEFAULT 'fixed';

-- Add INSERT policy for venues
CREATE POLICY "Auth users can create venues"
ON public.venues FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by_user_id);

-- Add UPDATE policy for venues
CREATE POLICY "Users can update own venues"
ON public.venues FOR UPDATE
TO authenticated
USING (auth.uid() = created_by_user_id);

-- Add DELETE policy for venues
CREATE POLICY "Users can delete own venues"
ON public.venues FOR DELETE
TO authenticated
USING (auth.uid() = created_by_user_id);

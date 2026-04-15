
-- Add new columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS photo_public boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS messages_public boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS age_public boolean NOT NULL DEFAULT false;

-- Create user_follows table
CREATE TABLE public.user_follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows"
  ON public.user_follows FOR SELECT
  USING (true);

CREATE POLICY "Auth users can follow"
  ON public.user_follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.user_follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

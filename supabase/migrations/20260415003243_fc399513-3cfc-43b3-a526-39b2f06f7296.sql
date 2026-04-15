
-- Create user_friends table for friend connections
CREATE TABLE public.user_friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_friendship UNIQUE (user_id, friend_id),
  CONSTRAINT no_self_friend CHECK (user_id != friend_id)
);

-- Enable RLS
ALTER TABLE public.user_friends ENABLE ROW LEVEL SECURITY;

-- Users can view friendships they're part of
CREATE POLICY "Users can view own friendships"
ON public.user_friends FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests"
ON public.user_friends FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Receiving user can accept (update status)
CREATE POLICY "Receiving user can update friendship"
ON public.user_friends FOR UPDATE
TO authenticated
USING (auth.uid() = friend_id OR auth.uid() = user_id);

-- Either user can delete (unfriend or reject)
CREATE POLICY "Users can remove friendships"
ON public.user_friends FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Index for fast lookups
CREATE INDEX idx_user_friends_user_id ON public.user_friends(user_id);
CREATE INDEX idx_user_friends_friend_id ON public.user_friends(friend_id);
CREATE INDEX idx_user_friends_status ON public.user_friends(status);

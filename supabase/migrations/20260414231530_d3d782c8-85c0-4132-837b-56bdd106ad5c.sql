
-- 1. Add listing_mode to classifieds
ALTER TABLE public.classifieds ADD COLUMN IF NOT EXISTS listing_mode text;

-- 2. Create wall_posts table
CREATE TABLE public.wall_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wall_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view wall posts"
  ON public.wall_posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create wall posts"
  ON public.wall_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wall posts"
  ON public.wall_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wall posts"
  ON public.wall_posts FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Create neighbor_help_posts table
CREATE TABLE public.neighbor_help_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  help_type TEXT NOT NULL DEFAULT 'offer',
  category TEXT NOT NULL DEFAULT 'other',
  title TEXT NOT NULL,
  description TEXT,
  neighborhood TEXT,
  phone TEXT,
  whatsapp TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.neighbor_help_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active help posts"
  ON public.neighbor_help_posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create help posts"
  ON public.neighbor_help_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own help posts"
  ON public.neighbor_help_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own help posts"
  ON public.neighbor_help_posts FOR DELETE
  USING (auth.uid() = user_id);


ALTER TABLE public.wall_posts ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';

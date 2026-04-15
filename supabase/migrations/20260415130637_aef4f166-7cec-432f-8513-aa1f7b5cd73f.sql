ALTER TABLE public.wall_posts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'banned';
-- Add service_type, price_type, available_days columns to pet_posts
ALTER TABLE public.pet_posts ADD COLUMN IF NOT EXISTS service_type text DEFAULT 'sitting';
ALTER TABLE public.pet_posts ADD COLUMN IF NOT EXISTS price_type text DEFAULT 'per_session';
ALTER TABLE public.pet_posts ADD COLUMN IF NOT EXISTS available_days text[] DEFAULT '{}';

-- Add size, energy_level, is_vaccinated, is_neutered, good_with_children, good_with_pets columns for adoption posts
ALTER TABLE public.pet_posts ADD COLUMN IF NOT EXISTS size text;
ALTER TABLE public.pet_posts ADD COLUMN IF NOT EXISTS energy_level text;
ALTER TABLE public.pet_posts ADD COLUMN IF NOT EXISTS is_vaccinated boolean DEFAULT false;
ALTER TABLE public.pet_posts ADD COLUMN IF NOT EXISTS is_neutered boolean DEFAULT false;
ALTER TABLE public.pet_posts ADD COLUMN IF NOT EXISTS good_with_children boolean DEFAULT false;
ALTER TABLE public.pet_posts ADD COLUMN IF NOT EXISTS good_with_pets boolean DEFAULT false;
ALTER TABLE public.pet_posts ADD COLUMN IF NOT EXISTS age_years integer;
ALTER TABLE public.pet_posts ADD COLUMN IF NOT EXISTS age_months integer;
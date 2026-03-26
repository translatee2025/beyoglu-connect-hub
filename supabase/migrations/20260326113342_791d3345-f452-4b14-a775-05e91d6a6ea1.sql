ALTER TABLE public.pet_profiles 
  ADD COLUMN IF NOT EXISTS size TEXT,
  ADD COLUMN IF NOT EXISTS energy_level TEXT,
  ADD COLUMN IF NOT EXISTS gender_preference TEXT DEFAULT 'any',
  ADD COLUMN IF NOT EXISTS size_preference TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS lifestyle_tags TEXT[] DEFAULT '{}';
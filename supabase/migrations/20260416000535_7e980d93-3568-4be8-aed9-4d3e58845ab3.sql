-- Migration 1: Add language_preference to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language_preference text DEFAULT 'tr';

-- Migration 2: Add species_id, breed_id, photos to pet_profiles
ALTER TABLE pet_profiles ADD COLUMN IF NOT EXISTS species_id uuid REFERENCES species(id);
ALTER TABLE pet_profiles ADD COLUMN IF NOT EXISTS breed_id uuid REFERENCES breeds(id);
ALTER TABLE pet_profiles ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';

-- Backfill species_id from existing enum
UPDATE pet_profiles SET species_id = (SELECT id FROM species WHERE LOWER(name_en) = LOWER(pet_profiles.species::text)) WHERE species_id IS NULL;

-- Migration 3: Create pet_sitting_posts
CREATE TABLE IF NOT EXISTS pet_sitting_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_type text NOT NULL,
  listing_type text NOT NULL,
  title text NOT NULL,
  description text,
  species_id uuid REFERENCES species(id),
  price numeric,
  price_type text,
  available_days text[] DEFAULT '{}',
  neighborhood text,
  district_id uuid REFERENCES districts(id),
  latitude double precision,
  longitude double precision,
  photos text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pet_sitting_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON pet_sitting_posts FOR SELECT USING (true);
CREATE POLICY "Owner insert" ON pet_sitting_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update" ON pet_sitting_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner delete" ON pet_sitting_posts FOR DELETE USING (auth.uid() = user_id);

-- Migration 4: Create families
CREATE TABLE IF NOT EXISTS families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_type text NOT NULL,
  title text NOT NULL,
  description text,
  category text,
  neighborhood text,
  district_id uuid REFERENCES districts(id),
  photos text[] DEFAULT '{}',
  price numeric,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON families FOR SELECT USING (true);
CREATE POLICY "Owner insert" ON families FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update" ON families FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner delete" ON families FOR DELETE USING (auth.uid() = user_id);

-- Migration 5: Create user_privacy_settings
CREATE TABLE IF NOT EXISTS user_privacy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  show_photo boolean DEFAULT true,
  allow_messages text DEFAULT 'everyone',
  show_age boolean DEFAULT false,
  show_gender boolean DEFAULT false,
  show_neighborhood boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner only" ON user_privacy_settings FOR ALL USING (auth.uid() = user_id);

-- Migration 6: Add rental columns to classifieds
ALTER TABLE classifieds ADD COLUMN IF NOT EXISTS room_type text;
ALTER TABLE classifieds ADD COLUMN IF NOT EXISTS size_m2 integer;
ALTER TABLE classifieds ADD COLUMN IF NOT EXISTS is_furnished boolean DEFAULT false;
ALTER TABLE classifieds ADD COLUMN IF NOT EXISTS pets_allowed boolean DEFAULT false;
ALTER TABLE classifieds ADD COLUMN IF NOT EXISTS floor_number integer;
ALTER TABLE classifieds ADD COLUMN IF NOT EXISTS total_floors integer;
ALTER TABLE classifieds ADD COLUMN IF NOT EXISTS available_from date;
ALTER TABLE classifieds ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE classifieds ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE classifieds ADD COLUMN IF NOT EXISTS listing_type text DEFAULT 'selling';

-- Migration 7: Add parking column to classifieds
ALTER TABLE classifieds ADD COLUMN IF NOT EXISTS parking_type text;
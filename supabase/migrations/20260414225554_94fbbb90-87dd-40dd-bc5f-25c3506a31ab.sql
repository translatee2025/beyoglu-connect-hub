
-- Create classifieds section enum
CREATE TYPE public.classified_section AS ENUM ('classifieds', 'rental', 'parking');

-- Create classifieds status enum
CREATE TYPE public.classified_status AS ENUM ('active', 'sold', 'closed');

-- Create classifieds table
CREATE TABLE public.classifieds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  section public.classified_section NOT NULL DEFAULT 'classifieds',
  category TEXT,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'offer',
  price TEXT,
  currency TEXT DEFAULT '₺',
  photos TEXT[],
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  neighborhood TEXT,
  phone TEXT,
  whatsapp TEXT,
  contact_preference TEXT DEFAULT 'phone',
  status public.classified_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.classifieds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active classifieds"
  ON public.classifieds FOR SELECT
  USING (status = 'active');

CREATE POLICY "Authenticated users can create classifieds"
  ON public.classifieds FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own classifieds"
  ON public.classifieds FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own classifieds"
  ON public.classifieds FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create pet post type enum
CREATE TYPE public.pet_post_type AS ENUM ('adoption', 'pet_sitting', 'friend', 'lost', 'found', 'shop', 'vet');

-- Create pet post status enum
CREATE TYPE public.pet_post_status AS ENUM ('active', 'resolved', 'closed');

-- Create pet_posts table
CREATE TABLE public.pet_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_type public.pet_post_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  photos TEXT[],
  species TEXT,
  breed TEXT,
  age_text TEXT,
  gender TEXT,
  price TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  opening_hours JSONB,
  is_offering BOOLEAN DEFAULT false,
  status public.pet_post_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pet posts"
  ON public.pet_posts FOR SELECT
  USING (status = 'active');

CREATE POLICY "Authenticated users can create pet posts"
  ON public.pet_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pet posts"
  ON public.pet_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pet posts"
  ON public.pet_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_classifieds_section ON public.classifieds (section);
CREATE INDEX idx_classifieds_status ON public.classifieds (status);
CREATE INDEX idx_pet_posts_type ON public.pet_posts (post_type);
CREATE INDEX idx_pet_posts_status ON public.pet_posts (status);

-- Updated_at triggers (reuse existing function if available)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_classifieds_updated_at
  BEFORE UPDATE ON public.classifieds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pet_posts_updated_at
  BEFORE UPDATE ON public.pet_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

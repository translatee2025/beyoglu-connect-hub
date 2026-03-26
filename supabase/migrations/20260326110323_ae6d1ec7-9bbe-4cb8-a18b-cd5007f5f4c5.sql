
-- Create timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  neighborhood TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Pet species enum
CREATE TYPE public.pet_species AS ENUM ('dog', 'cat', 'bird', 'rabbit', 'fish', 'other');

-- Pet personality tags enum
CREATE TYPE public.pet_personality AS ENUM ('friendly', 'energetic', 'calm', 'shy', 'playful', 'protective', 'curious', 'independent');

-- Pet profiles table
CREATE TABLE public.pet_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species pet_species NOT NULL DEFAULT 'dog',
  breed TEXT,
  age_years INTEGER,
  age_months INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'unknown')),
  is_neutered BOOLEAN DEFAULT false,
  weight_kg NUMERIC(5,2),
  bio TEXT,
  photo_url TEXT,
  personality_tags pet_personality[] DEFAULT '{}',
  looking_for TEXT[] DEFAULT '{}',
  neighborhood TEXT,
  is_lost BOOLEAN DEFAULT false,
  lost_details TEXT,
  lost_location TEXT,
  lost_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pet profiles are viewable by everyone" ON public.pet_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own pets" ON public.pet_profiles FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update their own pets" ON public.pet_profiles FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete their own pets" ON public.pet_profiles FOR DELETE USING (auth.uid() = owner_id);

CREATE TRIGGER update_pet_profiles_updated_at BEFORE UPDATE ON public.pet_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Pet photos table
CREATE TABLE public.pet_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL REFERENCES public.pet_profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pet photos are viewable by everyone" ON public.pet_photos FOR SELECT USING (true);
CREATE POLICY "Owners can insert pet photos" ON public.pet_photos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.pet_profiles WHERE id = pet_id AND owner_id = auth.uid()));
CREATE POLICY "Owners can delete pet photos" ON public.pet_photos FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.pet_profiles WHERE id = pet_id AND owner_id = auth.uid()));

-- Pet friend connections
CREATE TABLE public.pet_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL REFERENCES public.pet_profiles(id) ON DELETE CASCADE,
  friend_pet_id UUID NOT NULL REFERENCES public.pet_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (pet_id, friend_pet_id)
);

ALTER TABLE public.pet_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pet connections viewable by everyone" ON public.pet_connections FOR SELECT USING (true);
CREATE POLICY "Pet owners can send friend requests" ON public.pet_connections FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.pet_profiles WHERE id = pet_id AND owner_id = auth.uid()));
CREATE POLICY "Pet owners can update received requests" ON public.pet_connections FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.pet_profiles WHERE id = friend_pet_id AND owner_id = auth.uid()));


-- Venue type groups
CREATE TABLE public.venue_type_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  color_accent TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Venue types
CREATE TABLE public.venue_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.venue_type_groups(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  default_attributes JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);

-- Venue attribute definitions
CREATE TABLE public.venue_attribute_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_type_id UUID REFERENCES public.venue_types(id) ON DELETE CASCADE NOT NULL,
  attribute_key TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  is_required BOOLEAN DEFAULT false,
  options JSONB,
  sort_order INT DEFAULT 0
);

-- Venues
CREATE TABLE public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_type_id UUID REFERENCES public.venue_types(id) NOT NULL,
  neighborhood TEXT,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  phone TEXT,
  website TEXT,
  email TEXT,
  photos TEXT[] DEFAULT '{}',
  cover_photo TEXT,
  logo TEXT,
  hours JSONB,
  is_verified BOOLEAN DEFAULT false,
  is_claimed BOOLEAN DEFAULT false,
  claimed_by_user_id UUID,
  created_by_user_id UUID,
  status TEXT DEFAULT 'active',
  rating_avg DOUBLE PRECISION DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Venue attributes (key-value)
CREATE TABLE public.venue_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  attribute_key TEXT NOT NULL,
  value TEXT
);

-- Venue reviews
CREATE TABLE public.venue_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  rating INT NOT NULL,
  body TEXT,
  photos TEXT[] DEFAULT '{}',
  helpful_count INT DEFAULT 0,
  reply_body TEXT,
  reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Venue saves
CREATE TABLE public.venue_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, venue_id)
);

-- Venue deals
CREATE TABLE public.venue_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  discount_label TEXT,
  expires_at TIMESTAMPTZ,
  qr_code_token UUID DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Venue claims
CREATE TABLE public.venue_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  role_at_venue TEXT,
  phone TEXT,
  document_url TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Venue menu items
CREATE TABLE public.venue_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  section_label TEXT,
  item_name TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  currency TEXT DEFAULT 'TRY',
  photo TEXT,
  is_available BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);

-- Venue analytics
CREATE TABLE public.venue_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  profile_views INT DEFAULT 0,
  direction_taps INT DEFAULT 0,
  call_taps INT DEFAULT 0,
  message_taps INT DEFAULT 0,
  saves_count INT DEFAULT 0
);

-- Lost & Found posts
CREATE TABLE public.lost_found_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'lost',
  category TEXT NOT NULL DEFAULT 'pet',
  title TEXT NOT NULL,
  description TEXT,
  last_seen_lat DOUBLE PRECISION,
  last_seen_lng DOUBLE PRECISION,
  last_seen_at TIMESTAMPTZ,
  photo_urls TEXT[] DEFAULT '{}',
  contact_preference TEXT DEFAULT 'message_only',
  phone TEXT,
  neighborhood TEXT,
  status TEXT DEFAULT 'active',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.venue_type_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_attribute_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found_posts ENABLE ROW LEVEL SECURITY;

-- Public read policies for directory data
CREATE POLICY "Anyone can read venue type groups" ON public.venue_type_groups FOR SELECT USING (true);
CREATE POLICY "Anyone can read venue types" ON public.venue_types FOR SELECT USING (true);
CREATE POLICY "Anyone can read venue attribute definitions" ON public.venue_attribute_definitions FOR SELECT USING (true);
CREATE POLICY "Anyone can read venues" ON public.venues FOR SELECT USING (true);
CREATE POLICY "Anyone can read venue attributes" ON public.venue_attributes FOR SELECT USING (true);
CREATE POLICY "Anyone can read venue reviews" ON public.venue_reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can read venue deals" ON public.venue_deals FOR SELECT USING (true);
CREATE POLICY "Anyone can read venue menu items" ON public.venue_menu_items FOR SELECT USING (true);
CREATE POLICY "Anyone can read lost found posts" ON public.lost_found_posts FOR SELECT USING (true);

-- Authenticated write policies
CREATE POLICY "Auth users can create venue reviews" ON public.venue_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users can save venues" ON public.venue_saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users can read own saves" ON public.venue_saves FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Auth users can delete own saves" ON public.venue_saves FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Auth users can submit claims" ON public.venue_claims FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users can create lost found" ON public.lost_found_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users can update own lost found" ON public.lost_found_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);

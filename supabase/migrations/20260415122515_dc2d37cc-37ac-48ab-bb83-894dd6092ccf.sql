
-- ===================== DISTRICTS =====================
CREATE TABLE IF NOT EXISTS public.districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text DEFAULT 'Istanbul',
  slug text UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read districts" ON public.districts FOR SELECT USING (true);
CREATE POLICY "Auth users can insert districts" ON public.districts FOR INSERT TO authenticated WITH CHECK (true);

-- Seed 39 Istanbul districts (only if empty)
INSERT INTO public.districts (name, slug)
SELECT d.name, d.slug FROM (VALUES
  ('Adalar','adalar'),('Arnavutköy','arnavutkoy'),('Ataşehir','atasehir'),('Avcılar','avcilar'),
  ('Bağcılar','bagcilar'),('Bahçelievler','bahcelievler'),('Bakırköy','bakirkoy'),('Başakşehir','basaksehir'),
  ('Bayrampaşa','bayrampasa'),('Beşiktaş','besiktas'),('Beykoz','beykoz'),('Beylikdüzü','beylikduzu'),
  ('Beyoğlu','beyoglu'),('Büyükçekmece','buyukcekmece'),('Çatalca','catalca'),('Çekmeköy','cekmekoy'),
  ('Esenler','esenler'),('Esenyurt','esenyurt'),('Eyüpsultan','eyupsultan'),('Fatih','fatih'),
  ('Gaziosmanpaşa','gaziosmanpasa'),('Güngören','gungoren'),('Kadıköy','kadikoy'),('Kağıthane','kagithane'),
  ('Kartal','kartal'),('Küçükçekmece','kucukcekmece'),('Maltepe','maltepe'),('Pendik','pendik'),
  ('Sancaktepe','sancaktepe'),('Sarıyer','sariyer'),('Şile','sile'),('Şişli','sisli'),
  ('Silivri','silivri'),('Sultanbeyli','sultanbeyli'),('Sultangazi','sultangazi'),('Tuzla','tuzla'),
  ('Ümraniye','umraniye'),('Üsküdar','uskudar'),('Zeytinburnu','zeytinburnu')
) AS d(name, slug)
WHERE NOT EXISTS (SELECT 1 FROM public.districts LIMIT 1);

-- ===================== EVENTS =====================
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  venue_name text,
  address text,
  lat numeric,
  lng numeric,
  neighborhood text,
  cover_photo text,
  photos text[] DEFAULT '{}',
  is_free boolean DEFAULT true,
  price numeric,
  currency text DEFAULT 'TRY',
  max_attendees integer,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active events" ON public.events FOR SELECT USING (status = 'active');
CREATE POLICY "Auth users can create events" ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON public.events FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON public.events FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read attendees" ON public.event_attendees FOR SELECT USING (true);
CREATE POLICY "Auth users can attend" ON public.event_attendees FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own attendance" ON public.event_attendees FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===================== NOTIFICATIONS =====================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text,
  body text NOT NULL,
  link text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Auth users can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- ===================== REPORTS =====================
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending',
  admin_note text,
  actioned_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can submit reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can read reports" ON public.reports FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update reports" ON public.reports FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- ===================== USER REVIEWS =====================
CREATE TABLE IF NOT EXISTS public.user_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  rating integer NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(reviewer_id, target_user_id)
);
ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read user reviews" ON public.user_reviews FOR SELECT USING (true);
CREATE POLICY "Auth users can create reviews" ON public.user_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can update own reviews" ON public.user_reviews FOR UPDATE TO authenticated USING (auth.uid() = reviewer_id);
CREATE POLICY "Users can delete own reviews" ON public.user_reviews FOR DELETE TO authenticated USING (auth.uid() = reviewer_id);

-- Rating validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_review_rating()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_review_rating
  BEFORE INSERT OR UPDATE ON public.user_reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_review_rating();

-- ===================== ADD COLUMNS TO EXISTING TABLES =====================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES public.districts(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;

ALTER TABLE public.wall_posts ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES public.districts(id);
ALTER TABLE public.wall_posts ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id);

ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES public.districts(id);
ALTER TABLE public.lost_found_posts ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES public.districts(id);
ALTER TABLE public.neighbor_help_posts ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES public.districts(id);
ALTER TABLE public.pet_profiles ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES public.districts(id);
ALTER TABLE public.pet_posts ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES public.districts(id);
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES public.districts(id);

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS type text DEFAULT 'dm';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS status text DEFAULT 'accepted';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_at timestamptz;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS venue_id uuid;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS group_id uuid;

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at timestamptz;

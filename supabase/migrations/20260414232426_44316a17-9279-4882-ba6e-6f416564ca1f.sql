
CREATE TABLE public.classified_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  section TEXT NOT NULL DEFAULT 'classifieds',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.classified_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
  ON public.classified_categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.classified_categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

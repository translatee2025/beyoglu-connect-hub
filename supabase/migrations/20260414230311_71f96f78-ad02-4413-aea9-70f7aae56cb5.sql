
-- Languages table
CREATE TABLE public.languages (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  direction TEXT DEFAULT 'ltr',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read languages"
  ON public.languages FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage languages"
  ON public.languages FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Translations table
CREATE TABLE public.translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  language_code TEXT NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  translation_key TEXT NOT NULL,
  translation_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (language_code, translation_key)
);

ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read translations"
  ON public.translations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage translations"
  ON public.translations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_translations_lang ON public.translations (language_code);
CREATE INDEX idx_translations_key ON public.translations (translation_key);

CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON public.translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

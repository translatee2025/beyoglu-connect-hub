CREATE TABLE IF NOT EXISTS public.app_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_key text NOT NULL,
  value_key text NOT NULL,
  label_en text NOT NULL,
  label_tr text NOT NULL,
  emoji text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_key, value_key)
);

CREATE INDEX IF NOT EXISTS idx_app_options_group ON public.app_options(group_key, sort_order);

ALTER TABLE public.app_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read app_options" ON public.app_options
  FOR SELECT USING (true);

CREATE POLICY "Admin manage app_options" ON public.app_options
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'vendor', 'user');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow first user to self-assign admin when no admin exists
CREATE POLICY "First user can become admin"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'admin'
    AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
  );

-- Site settings table (key-value)
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '""'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
  ON public.site_settings FOR SELECT USING (true);

CREATE POLICY "Admins can upsert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Module settings
CREATE TABLE public.module_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  icon TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.module_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read modules"
  ON public.module_settings FOR SELECT USING (true);

CREATE POLICY "Admins can modify modules"
  ON public.module_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert modules"
  ON public.module_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Theme settings
CREATE TABLE public.theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_name TEXT,
  primary_color TEXT NOT NULL DEFAULT '#ffffff',
  accent_color TEXT NOT NULL DEFAULT '#1a1a2e',
  background_color TEXT NOT NULL DEFAULT '#0a0a0a',
  card_background TEXT NOT NULL DEFAULT 'rgba(255,255,255,0.06)',
  text_color TEXT NOT NULL DEFAULT '#f0f0f0',
  nav_color TEXT NOT NULL DEFAULT 'rgba(10,10,10,0.85)',
  button_color TEXT NOT NULL DEFAULT '#ffffff',
  border_color TEXT NOT NULL DEFAULT 'rgba(255,255,255,0.1)',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read theme"
  ON public.theme_settings FOR SELECT USING (true);

CREATE POLICY "Admins can modify theme"
  ON public.theme_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert theme"
  ON public.theme_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Audit log
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log"
  ON public.audit_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit log"
  ON public.audit_log FOR INSERT
  WITH CHECK (true);

-- Seed default modules
INSERT INTO public.module_settings (module_key, label, icon, is_enabled, sort_order) VALUES
  ('directory', 'Directory', 'MapPin', true, 1),
  ('feed', 'Feed', 'MessageSquare', true, 2),
  ('events', 'Events', 'Calendar', true, 3),
  ('groups', 'Groups', 'Users', true, 4),
  ('classifieds', 'Classifieds', 'ShoppingBag', true, 5),
  ('pets', 'Pets', 'PawPrint', true, 6),
  ('wall', 'Wall', 'Newspaper', true, 7),
  ('lost_found', 'Lost & Found', 'Search', true, 8);

-- Seed default theme
INSERT INTO public.theme_settings (preset_name, primary_color, accent_color, background_color, card_background, text_color, nav_color, button_color, border_color)
VALUES ('default', '#ffffff', '#1a1a2e', '#0a0a0a', 'rgba(255,255,255,0.06)', '#f0f0f0', 'rgba(10,10,10,0.85)', '#ffffff', 'rgba(255,255,255,0.1)');

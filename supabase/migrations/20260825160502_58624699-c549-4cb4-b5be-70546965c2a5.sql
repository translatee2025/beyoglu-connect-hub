-- 1. Private contact info (phone, age) out of the public profiles table
CREATE TABLE public.user_contact_info (
  user_id uuid PRIMARY KEY,
  phone text,
  age integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_contact_info TO authenticated;
GRANT ALL ON public.user_contact_info TO service_role;

ALTER TABLE public.user_contact_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contact info"
  ON public.user_contact_info FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contact info"
  ON public.user_contact_info FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact info"
  ON public.user_contact_info FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact info"
  ON public.user_contact_info FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_contact_info_updated_at
  BEFORE UPDATE ON public.user_contact_info
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.user_contact_info (user_id, phone, age)
SELECT user_id, phone, age FROM public.profiles
WHERE phone IS NOT NULL OR age IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE public.profiles DROP COLUMN phone;
ALTER TABLE public.profiles DROP COLUMN age;

-- 2. Storage: scope event photo uploads to the uploader's own folder
DROP POLICY IF EXISTS "Auth users can upload event photos" ON storage.objects;
CREATE POLICY "Auth users can upload event photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'events'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- 3. Storage: scope group photo uploads/updates to the uploader's own folder
DROP POLICY IF EXISTS "Auth users can upload group photos" ON storage.objects;
CREATE POLICY "Auth users can upload group photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'groups'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Auth users can update group photos" ON storage.objects;
CREATE POLICY "Auth users can update own group photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'groups'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'groups'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- 4. Remove the client-reachable first-admin bootstrap privilege escalation
DROP POLICY IF EXISTS "First user can become admin" ON public.user_roles;

-- 5. SECURITY DEFINER functions: trigger-only functions must not be callable
--    through the API, and has_role may only answer for the calling user.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_conversation_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_review_rating() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND _user_id = auth.uid()
  )
$function$;
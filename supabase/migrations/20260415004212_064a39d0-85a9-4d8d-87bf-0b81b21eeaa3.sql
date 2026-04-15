
-- Drop the FK so we can seed demo profiles without needing auth.users entries
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

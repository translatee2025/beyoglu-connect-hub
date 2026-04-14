
-- Assign admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('77b0bd8d-46aa-4bc3-989f-8eb78d875086', 'admin')
ON CONFLICT DO NOTHING;

-- Add phone column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

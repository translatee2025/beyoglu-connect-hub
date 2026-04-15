
-- Fix districts: only admins should insert districts
DROP POLICY "Auth users can insert districts" ON public.districts;
CREATE POLICY "Admins can insert districts" ON public.districts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix notifications: inserter must set user_id to a real user, restrict to authenticated
DROP POLICY "Auth users can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id IS NOT NULL);

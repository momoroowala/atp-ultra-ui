CREATE POLICY "Staff can view all user profiles"
  ON public.user_profiles
  FOR SELECT
  USING (is_staff(auth.uid()));
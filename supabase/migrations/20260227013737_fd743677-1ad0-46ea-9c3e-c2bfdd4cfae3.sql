CREATE POLICY "Staff can view all public profiles"
  ON public.user_public_profiles
  FOR SELECT
  TO authenticated
  USING (is_staff(auth.uid()));
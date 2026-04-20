CREATE POLICY "Staff can update user profiles"
  ON public.user_profiles
  FOR UPDATE
  USING (is_staff(auth.uid()))
  WITH CHECK (is_staff(auth.uid()));
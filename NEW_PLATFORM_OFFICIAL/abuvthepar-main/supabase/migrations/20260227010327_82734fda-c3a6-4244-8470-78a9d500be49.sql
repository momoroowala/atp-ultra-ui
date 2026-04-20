CREATE POLICY "Users can view their assigned CSM profile"
  ON public.user_profiles FOR SELECT
  USING (
    id IN (
      SELECT assigned_csm_id FROM public.user_profiles WHERE id = auth.uid()
    )
  );
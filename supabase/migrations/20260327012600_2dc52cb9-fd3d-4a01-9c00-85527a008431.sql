CREATE POLICY "Admins can delete any lead"
  ON public.brand_leads FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()) OR has_role_key(auth.uid(), 'mega_admin'));
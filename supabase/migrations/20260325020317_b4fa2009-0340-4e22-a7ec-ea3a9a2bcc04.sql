DROP POLICY IF EXISTS "Admins can manage channels" ON community_channels;

CREATE POLICY "Admins and mega admins can manage channels"
  ON community_channels
  FOR ALL
  TO authenticated
  USING (
    is_admin(auth.uid()) OR has_role_key(auth.uid(), 'mega_admin')
  )
  WITH CHECK (
    is_admin(auth.uid()) OR has_role_key(auth.uid(), 'mega_admin')
  );
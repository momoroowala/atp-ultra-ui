DROP POLICY IF EXISTS "Staff can manage ticket metadata" ON public.ticket_metadata;

CREATE POLICY "Staff can manage ticket metadata"
  ON public.ticket_metadata FOR ALL
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR has_role_key(auth.uid(), 'mega_admin')
    OR (is_staff(auth.uid()) AND EXISTS (
      SELECT 1 FROM support_tickets st
      WHERE st.id = ticket_metadata.ticket_id
        AND COALESCE(st.topic, '') <> 'Bug Report'
    ))
  )
  WITH CHECK (
    is_admin(auth.uid())
    OR has_role_key(auth.uid(), 'mega_admin')
    OR (is_staff(auth.uid()) AND EXISTS (
      SELECT 1 FROM support_tickets st
      WHERE st.id = ticket_metadata.ticket_id
        AND COALESCE(st.topic, '') <> 'Bug Report'
    ))
  );
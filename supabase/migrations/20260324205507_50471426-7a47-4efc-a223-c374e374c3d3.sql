-- Fix SELECT policy to allow mega_admin to see bug report tickets
DROP POLICY IF EXISTS "Users and staff can view tickets" ON support_tickets;
CREATE POLICY "Users and staff can view tickets"
  ON support_tickets FOR SELECT TO authenticated
  USING (
    submitter_user_id = auth.uid()
    OR is_admin(auth.uid())
    OR has_role_key(auth.uid(), 'mega_admin')
    OR (is_staff(auth.uid()) AND COALESCE(topic, '') <> 'Bug Report')
  );

-- Fix UPDATE policy to allow mega_admin to update bug report tickets
DROP POLICY IF EXISTS "Users and staff can update tickets" ON support_tickets;
CREATE POLICY "Users and staff can update tickets"
  ON support_tickets FOR UPDATE TO authenticated
  USING (
    submitter_user_id = auth.uid()
    OR is_admin(auth.uid())
    OR has_role_key(auth.uid(), 'mega_admin')
    OR (is_staff(auth.uid()) AND COALESCE(topic, '') <> 'Bug Report')
  );
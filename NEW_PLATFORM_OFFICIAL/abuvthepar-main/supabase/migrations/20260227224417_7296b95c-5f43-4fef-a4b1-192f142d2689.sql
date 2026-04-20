
-- Helper: check if user is CSM (not admin)
CREATE OR REPLACE FUNCTION public.is_csm_only(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.roles r ON r.id = up.role_id
    WHERE up.id = _user_id
      AND r.role_key = 'csm'
      AND up.is_active = true
  )
$$;

-- ============ support_tickets ============

-- SELECT: owner OR admin (all) OR staff-non-admin (exclude bug reports)
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
CREATE POLICY "Users and staff can view tickets" ON support_tickets
  FOR SELECT TO authenticated
  USING (
    submitter_user_id = auth.uid()
    OR is_admin(auth.uid())
    OR (is_staff(auth.uid()) AND COALESCE(topic, '') <> 'Bug Report')
  );

-- UPDATE: owner OR admin (all) OR staff-non-admin (exclude bug reports)
DROP POLICY IF EXISTS "Users can update own tickets" ON support_tickets;
CREATE POLICY "Users and staff can update tickets" ON support_tickets
  FOR UPDATE TO authenticated
  USING (
    submitter_user_id = auth.uid()
    OR is_admin(auth.uid())
    OR (is_staff(auth.uid()) AND COALESCE(topic, '') <> 'Bug Report')
  );

-- ============ ticket_responses ============

DROP POLICY IF EXISTS "Users can view responses on own tickets" ON ticket_responses;
CREATE POLICY "Users and staff can view responses" ON ticket_responses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets st
      WHERE st.id = ticket_responses.ticket_id
        AND (
          st.submitter_user_id = auth.uid()
          OR is_admin(auth.uid())
          OR (is_staff(auth.uid()) AND COALESCE(st.topic, '') <> 'Bug Report')
        )
    )
  );

-- ============ ticket_metadata ============

DROP POLICY IF EXISTS "Admins can manage ticket metadata" ON ticket_metadata;
CREATE POLICY "Staff can manage ticket metadata" ON ticket_metadata
  FOR ALL TO authenticated
  USING (
    is_admin(auth.uid())
    OR (is_staff(auth.uid()) AND EXISTS (
      SELECT 1 FROM support_tickets st
      WHERE st.id = ticket_metadata.ticket_id
        AND COALESCE(st.topic, '') <> 'Bug Report'
    ))
  )
  WITH CHECK (
    is_admin(auth.uid())
    OR (is_staff(auth.uid()) AND EXISTS (
      SELECT 1 FROM support_tickets st
      WHERE st.id = ticket_metadata.ticket_id
        AND COALESCE(st.topic, '') <> 'Bug Report'
    ))
  );

-- ============ ticket_internal_notes ============

DROP POLICY IF EXISTS "Admins can manage internal notes" ON ticket_internal_notes;
CREATE POLICY "Staff can manage internal notes" ON ticket_internal_notes
  FOR ALL TO authenticated
  USING (
    is_admin(auth.uid())
    OR (is_staff(auth.uid()) AND EXISTS (
      SELECT 1 FROM support_tickets st
      WHERE st.id = ticket_internal_notes.ticket_id
        AND COALESCE(st.topic, '') <> 'Bug Report'
    ))
  )
  WITH CHECK (
    is_admin(auth.uid())
    OR (is_staff(auth.uid()) AND EXISTS (
      SELECT 1 FROM support_tickets st
      WHERE st.id = ticket_internal_notes.ticket_id
        AND COALESCE(st.topic, '') <> 'Bug Report'
    ))
  );

-- ============ support_notifications ============

DROP POLICY IF EXISTS "Users can view own notifications" ON support_notifications;
CREATE POLICY "Users and staff can view notifications" ON support_notifications
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_admin(auth.uid())
    OR (is_staff(auth.uid()) AND EXISTS (
      SELECT 1 FROM support_tickets st
      WHERE st.id = support_notifications.ticket_id
        AND COALESCE(st.topic, '') <> 'Bug Report'
    ))
  );

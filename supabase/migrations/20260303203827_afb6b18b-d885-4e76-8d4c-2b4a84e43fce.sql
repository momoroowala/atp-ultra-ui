
-- Update calendar_calls RLS policies to allow staff (admin, csm, executive)
DROP POLICY "Admins can insert calls" ON calendar_calls;
CREATE POLICY "Staff can insert calls" ON calendar_calls FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));

DROP POLICY "Admins can update calls" ON calendar_calls;
CREATE POLICY "Staff can update calls" ON calendar_calls FOR UPDATE TO authenticated USING (is_staff(auth.uid()));

DROP POLICY "Admins can delete calls" ON calendar_calls;
CREATE POLICY "Staff can delete calls" ON calendar_calls FOR DELETE TO authenticated USING (is_staff(auth.uid()));

-- Update call_recordings RLS policies to allow staff
DROP POLICY "Admins can insert recordings" ON call_recordings;
CREATE POLICY "Staff can insert recordings" ON call_recordings FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));

DROP POLICY "Admins can update recordings" ON call_recordings;
CREATE POLICY "Staff can update recordings" ON call_recordings FOR UPDATE TO authenticated USING (is_staff(auth.uid()));

DROP POLICY "Admins can delete recordings" ON call_recordings;
CREATE POLICY "Staff can delete recordings" ON call_recordings FOR DELETE TO authenticated USING (is_staff(auth.uid()));

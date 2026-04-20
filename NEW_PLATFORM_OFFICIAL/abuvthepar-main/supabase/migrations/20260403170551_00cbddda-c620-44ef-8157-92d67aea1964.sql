-- 1. Drop the two overly permissive public policies on csm_outreach_status
DROP POLICY "CSM staff can read outreach status" ON public.csm_outreach_status;
DROP POLICY "CSM staff can upsert outreach status" ON public.csm_outreach_status;

-- 2. Fix ticket_responses INSERT policy to prevent staff impersonation
DROP POLICY "Authenticated users can create responses" ON public.ticket_responses;
CREATE POLICY "Controlled response creation" ON public.ticket_responses
  FOR INSERT TO authenticated
  WITH CHECK (
    responder_user_id = auth.uid()
    AND (is_staff = false OR is_staff(auth.uid()))
  );

-- 3. Fix fathom_meeting_notes - restrict to staff only
DROP POLICY "Authenticated users can view fathom notes" ON public.fathom_meeting_notes;
CREATE POLICY "Staff can view fathom notes" ON public.fathom_meeting_notes
  FOR SELECT TO authenticated
  USING (is_staff(auth.uid()));
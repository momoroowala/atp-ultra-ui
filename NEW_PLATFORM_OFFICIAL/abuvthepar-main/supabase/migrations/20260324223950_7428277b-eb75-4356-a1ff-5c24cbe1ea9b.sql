CREATE POLICY "Ticket submitters can manage own metadata"
ON public.ticket_metadata
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM support_tickets st
    WHERE st.id = ticket_metadata.ticket_id
    AND st.submitter_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM support_tickets st
    WHERE st.id = ticket_metadata.ticket_id
    AND st.submitter_user_id = auth.uid()
  )
);
-- Allow authenticated users to view user review assignments
-- This is needed so coaches can see which users are assigned to them
CREATE POLICY "Authenticated users can view assignments"
ON public.user_review_assignments
FOR SELECT
TO authenticated
USING (true);
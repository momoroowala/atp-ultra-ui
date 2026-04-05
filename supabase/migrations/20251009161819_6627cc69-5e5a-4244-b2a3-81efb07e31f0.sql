-- Add admin SELECT policy for phases table
CREATE POLICY "Admins can view all phases for management"
ON public.phases
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));
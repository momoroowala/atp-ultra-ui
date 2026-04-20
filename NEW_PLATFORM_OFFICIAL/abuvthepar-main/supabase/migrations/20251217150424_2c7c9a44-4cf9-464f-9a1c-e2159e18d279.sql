-- Drop the existing policy that uses has_role()
DROP POLICY IF EXISTS "Mega admins can manage tiers" ON public.tiers;

-- Create new policy using is_admin() for consistency
CREATE POLICY "Admins can manage tiers"
ON public.tiers
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
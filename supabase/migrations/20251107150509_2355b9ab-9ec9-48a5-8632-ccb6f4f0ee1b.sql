-- Drop the existing insert policy to recreate it with explicit permissions
DROP POLICY IF EXISTS "Admins can insert courses" ON public.courses;

-- Recreate the insert policy to explicitly allow any is_active value
CREATE POLICY "Admins can insert courses"
ON public.courses
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin(auth.uid())
  -- Explicitly allow any value for is_active (true or false)
);

-- Also ensure the update policy allows changing is_active
DROP POLICY IF EXISTS "Admins can update courses" ON public.courses;

CREATE POLICY "Admins can update courses"
ON public.courses
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
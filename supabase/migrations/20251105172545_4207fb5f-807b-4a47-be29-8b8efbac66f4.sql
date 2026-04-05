-- Ensure RLS policies allow admins to manage courses
DO $$ BEGIN
  ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Allow only admins to insert courses
DROP POLICY IF EXISTS "Admins can insert courses" ON public.courses;
CREATE POLICY "Admins can insert courses"
ON public.courses
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Allow only admins to update courses
DROP POLICY IF EXISTS "Admins can update courses" ON public.courses;
CREATE POLICY "Admins can update courses"
ON public.courses
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Allow only admins to delete courses
DROP POLICY IF EXISTS "Admins can delete courses" ON public.courses;
CREATE POLICY "Admins can delete courses"
ON public.courses
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));
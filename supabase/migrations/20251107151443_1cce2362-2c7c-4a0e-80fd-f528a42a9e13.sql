-- Ensure admins can SELECT any course regardless of is_active
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'courses' AND policyname = 'Admins can view all courses') THEN
      CREATE POLICY "Admins can view all courses"
      ON public.courses
      FOR SELECT
      TO authenticated
      USING (is_admin(auth.uid()));
  END IF;
END $$;
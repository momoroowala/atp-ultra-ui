
-- Drop and recreate INSERT policy using is_staff instead of is_admin
DROP POLICY IF EXISTS "Admins can insert task responses for any user" ON public.task_responses;
CREATE POLICY "Staff can insert task responses for any user"
ON public.task_responses FOR INSERT TO authenticated
WITH CHECK (is_staff(auth.uid()));

-- Drop and recreate UPDATE policy using is_staff instead of is_admin
DROP POLICY IF EXISTS "Admins can update task responses for any user" ON public.task_responses;
CREATE POLICY "Staff can update task responses for any user"
ON public.task_responses FOR UPDATE TO authenticated
USING (is_staff(auth.uid()));

-- Allow admins to insert task responses for any user (enables Mark Complete)
CREATE POLICY "Admins can insert task responses for any user"
ON public.task_responses
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- Allow admins to update task responses for any user (enables Mark Complete/Incomplete)
CREATE POLICY "Admins can update task responses for any user"
ON public.task_responses
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

-- Allow admins to delete quiz submissions (used by admin tools)
CREATE POLICY "Admins can delete any quiz submission"
ON public.quiz_submissions
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));
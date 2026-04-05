CREATE POLICY "Users can delete own completions"
ON public.sprint_task_completions
FOR DELETE TO authenticated
USING (user_id = auth.uid());
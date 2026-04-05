
-- Staff can manage sprint_phases (INSERT/UPDATE/DELETE)
CREATE POLICY "Staff can manage sprint phases" ON public.sprint_phases FOR ALL USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- Staff can manage sprint_tasks
CREATE POLICY "Staff can manage sprint tasks" ON public.sprint_tasks FOR ALL USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- Staff can manage sprint_task_modules
CREATE POLICY "Staff can manage sprint task modules" ON public.sprint_task_modules FOR ALL USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- Staff can view all completions
CREATE POLICY "Staff can view all completions" ON public.sprint_task_completions FOR SELECT USING (is_staff(auth.uid()));

-- Staff can manage any completion (mark/unmark for users)
CREATE POLICY "Staff can manage completions" ON public.sprint_task_completions FOR ALL USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

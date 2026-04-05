DROP POLICY IF EXISTS "Users can view accessible task sections" ON discipline_task_sections;

CREATE POLICY "Users can view accessible task sections"
ON discipline_task_sections
FOR SELECT
TO authenticated
USING (
  is_staff(auth.uid()) OR (
    EXISTS (
      SELECT 1
      FROM tasks t
      JOIN phases p ON t.phase_id = p.id
      WHERE t.id = discipline_task_sections.task_id
        AND t.is_active = true
        AND p.is_active = true
        AND has_course_access(auth.uid(), p.course_id)
    )
  )
);
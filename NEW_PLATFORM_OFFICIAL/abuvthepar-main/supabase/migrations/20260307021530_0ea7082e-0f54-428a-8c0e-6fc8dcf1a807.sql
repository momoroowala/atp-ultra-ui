-- Fix RLS: Replace is_admin() with is_staff() in SELECT policies for discipline_task_sections and discipline_task_form_fields

DROP POLICY "Users can view accessible task sections" ON discipline_task_sections;
CREATE POLICY "Users can view accessible task sections"
ON discipline_task_sections FOR SELECT TO authenticated
USING (
  is_staff(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM tasks t JOIN phases p ON t.phase_id = p.id
    WHERE t.id = discipline_task_sections.task_id
      AND t.is_active = true AND p.is_active = true
      AND has_course_access(auth.uid(), p.course_id)
      AND (t.visible_tier_ids IS NULL OR array_length(t.visible_tier_ids, 1) IS NULL
           OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND tier_id = ANY(t.visible_tier_ids)))
  )
);

DROP POLICY "Users can view accessible form fields" ON discipline_task_form_fields;
CREATE POLICY "Users can view accessible form fields"
ON discipline_task_form_fields FOR SELECT TO authenticated
USING (
  is_staff(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM tasks t JOIN phases p ON t.phase_id = p.id
    WHERE t.id = discipline_task_form_fields.task_id
      AND t.is_active = true AND p.is_active = true
      AND has_course_access(auth.uid(), p.course_id)
      AND (t.visible_tier_ids IS NULL OR array_length(t.visible_tier_ids, 1) IS NULL
           OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND tier_id = ANY(t.visible_tier_ids)))
  )
);
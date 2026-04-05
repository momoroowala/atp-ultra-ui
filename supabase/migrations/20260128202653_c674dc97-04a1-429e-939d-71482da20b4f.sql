-- Fix: Replace permissive RLS policies on discipline_task_sections and discipline_task_form_fields
-- with tier-based access control to protect premium course content

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can view task sections" ON discipline_task_sections;
DROP POLICY IF EXISTS "Users can view form fields" ON discipline_task_form_fields;

-- Create tier-based access policy for task sections
-- Allows access if:
-- 1. User is admin OR
-- 2. User has course access AND meets tier visibility requirements
CREATE POLICY "Users can view accessible task sections"
ON discipline_task_sections FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN phases p ON t.phase_id = p.id
    WHERE t.id = discipline_task_sections.task_id
    AND t.is_active = true
    AND p.is_active = true
    AND has_course_access(auth.uid(), p.course_id)
    AND (
      t.visible_tier_ids IS NULL OR
      array_length(t.visible_tier_ids, 1) IS NULL OR
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.tier_id = ANY(t.visible_tier_ids)
      )
    )
  )
);

-- Create tier-based access policy for form fields (same logic)
CREATE POLICY "Users can view accessible form fields"
ON discipline_task_form_fields FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN phases p ON t.phase_id = p.id
    WHERE t.id = discipline_task_form_fields.task_id
    AND t.is_active = true
    AND p.is_active = true
    AND has_course_access(auth.uid(), p.course_id)
    AND (
      t.visible_tier_ids IS NULL OR
      array_length(t.visible_tier_ids, 1) IS NULL OR
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.tier_id = ANY(t.visible_tier_ids)
      )
    )
  )
);
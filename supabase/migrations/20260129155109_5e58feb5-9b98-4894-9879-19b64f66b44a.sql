-- Fix Quiz RLS policy to use is_admin() instead of has_role()
-- The has_role() function checks user_roles table which is empty
-- The is_admin() function checks user_profiles.role_id which has actual admin data

-- Drop the existing broken policy
DROP POLICY IF EXISTS "Admins and ops can manage quizzes" ON quizzes;

-- Create new policy using is_admin() for consistency with other tables
CREATE POLICY "Admins can manage quizzes"
ON quizzes
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
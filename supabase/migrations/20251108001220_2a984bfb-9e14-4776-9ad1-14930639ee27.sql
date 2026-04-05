-- Fix RLS policy for phase_quiz_requirements to allow admin inserts
-- Drop existing policies
DROP POLICY IF EXISTS "Admins and ops can manage phase quiz requirements" ON phase_quiz_requirements;
DROP POLICY IF EXISTS "Authenticated users can view phase quiz requirements" ON phase_quiz_requirements;

-- Recreate with correct permissions
CREATE POLICY "Admins and ops can manage phase quiz requirements"
ON phase_quiz_requirements
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'mega_admin'::app_role) OR 
  has_role(auth.uid(), 'operations'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'mega_admin'::app_role) OR 
  has_role(auth.uid(), 'operations'::app_role)
);

CREATE POLICY "Authenticated users can view phase quiz requirements"
ON phase_quiz_requirements
FOR SELECT
USING (auth.uid() IS NOT NULL);
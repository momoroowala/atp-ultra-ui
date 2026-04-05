-- Create courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  course_order INTEGER NOT NULL,
  visible_tiers TEXT[] DEFAULT ARRAY['all'],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Users can view all active courses (including locked ones for discovery)
CREATE POLICY "Users can view all active courses"
  ON courses FOR SELECT
  USING (is_active = true);

-- Admins can manage courses
CREATE POLICY "Admins can manage courses"
  ON courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'mega_admin')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER handle_courses_updated_at 
  BEFORE UPDATE ON courses
  FOR EACH ROW 
  EXECUTE FUNCTION handle_updated_at();

-- Create user_course_access table for individual course grants
CREATE TABLE user_course_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  access_type TEXT DEFAULT 'granted',
  notes TEXT,
  UNIQUE(user_id, course_id)
);

-- Enable RLS on user_course_access
ALTER TABLE user_course_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own course access
CREATE POLICY "Users can view own course access"
  ON user_course_access FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can manage all course access
CREATE POLICY "Admins can manage course access"
  ON user_course_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'mega_admin', 'operations')
    )
  );

-- Add course_id to phases table
ALTER TABLE phases 
  ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_phases_course_id ON phases(course_id);

-- Add course_id to course_progress
ALTER TABLE course_progress
  ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

-- Rename lesson_id to module_id in course_progress
ALTER TABLE course_progress
  RENAME COLUMN lesson_id TO module_id;

-- Add composite index
CREATE INDEX idx_course_progress_user_course ON course_progress(user_id, course_id);

-- Create course access check function
CREATE OR REPLACE FUNCTION has_course_access(_user_id UUID, _course_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _course RECORD;
  _has_tier_access BOOLEAN;
  _has_individual_access BOOLEAN;
BEGIN
  -- Get course info
  SELECT * INTO _course FROM courses WHERE id = _course_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has tier-based access
  IF 'all' = ANY(_course.visible_tiers) THEN
    _has_tier_access := TRUE;
  ELSE
    SELECT EXISTS(
      SELECT 1 FROM user_roles
      WHERE user_id = _user_id
      AND role::text = ANY(_course.visible_tiers)
    ) INTO _has_tier_access;
  END IF;
  
  -- Check if user has individual access grant
  SELECT EXISTS(
    SELECT 1 FROM user_course_access
    WHERE user_id = _user_id AND course_id = _course_id
  ) INTO _has_individual_access;
  
  RETURN COALESCE(_has_tier_access, FALSE) OR COALESCE(_has_individual_access, FALSE);
END;
$$;

-- Insert default course
INSERT INTO courses (title, description, course_order, visible_tiers)
VALUES ('Main Program', 'Complete trading mastery program', 1, ARRAY['all']);

-- Update all existing phases to reference the default course
UPDATE phases 
SET course_id = (SELECT id FROM courses WHERE title = 'Main Program' LIMIT 1)
WHERE course_id IS NULL;

-- Make course_id NOT NULL after migration
ALTER TABLE phases ALTER COLUMN course_id SET NOT NULL;

-- Grant all existing users access to default course
INSERT INTO user_course_access (user_id, course_id, access_type, notes)
SELECT 
  id,
  (SELECT id FROM courses WHERE title = 'Main Program'),
  'tier_based',
  'Auto-granted during migration'
FROM auth.users
ON CONFLICT (user_id, course_id) DO NOTHING;
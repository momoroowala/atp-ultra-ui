-- Create user_course_access table for individual user access
CREATE TABLE IF NOT EXISTS public.user_course_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.user_course_access ENABLE ROW LEVEL SECURITY;

-- Admins can manage user course access
CREATE POLICY "Admins can manage user course access"
ON public.user_course_access
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Users can view their own course access
CREATE POLICY "Users can view their own course access"
ON public.user_course_access
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Update the has_course_access function to check both tier and individual access
CREATE OR REPLACE FUNCTION public.has_course_access(_user_id UUID, _course_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  course_visible_tiers TEXT[];
  user_tier_value TEXT;
  has_individual_access BOOLEAN;
BEGIN
  -- Get course visible tiers
  SELECT visible_tiers INTO course_visible_tiers
  FROM courses
  WHERE id = _course_id;

  -- If course allows 'all', return true
  IF 'all' = ANY(course_visible_tiers) THEN
    RETURN TRUE;
  END IF;

  -- Check for individual user access
  SELECT EXISTS (
    SELECT 1 FROM user_course_access
    WHERE user_id = _user_id AND course_id = _course_id
  ) INTO has_individual_access;

  IF has_individual_access THEN
    RETURN TRUE;
  END IF;

  -- Get user tier from user_roles table
  SELECT role::TEXT INTO user_tier_value
  FROM user_roles
  WHERE user_roles.user_id = _user_id
  LIMIT 1;

  -- Check if user's tier is in the allowed tiers
  RETURN user_tier_value = ANY(course_visible_tiers);
END;
$$;
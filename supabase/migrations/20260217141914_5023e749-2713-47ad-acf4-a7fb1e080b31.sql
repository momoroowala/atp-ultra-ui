CREATE OR REPLACE FUNCTION public.has_course_access(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  course_visible_tier_ids UUID[];
  user_tier_id UUID;
  has_individual_access BOOLEAN;
  all_tier_id UUID;
BEGIN
  -- Admins always have access to all courses
  IF is_admin(_user_id) THEN RETURN TRUE; END IF;

  SELECT id INTO all_tier_id FROM tiers WHERE tier_key = 'all';
  SELECT visible_tier_ids INTO course_visible_tier_ids FROM courses WHERE id = _course_id;
  IF all_tier_id = ANY(course_visible_tier_ids) THEN RETURN TRUE; END IF;
  SELECT EXISTS (SELECT 1 FROM user_course_access WHERE user_id = _user_id AND course_id = _course_id) INTO has_individual_access;
  IF has_individual_access THEN RETURN TRUE; END IF;
  SELECT tier_id INTO user_tier_id FROM user_profiles WHERE id = _user_id;
  IF user_tier_id IS NULL THEN
    SELECT t.id INTO user_tier_id FROM user_roles ur JOIN tiers t ON t.tier_key = ur.role::text WHERE ur.user_id = _user_id LIMIT 1;
  END IF;
  RETURN user_tier_id = ANY(course_visible_tier_ids);
END;
$$;
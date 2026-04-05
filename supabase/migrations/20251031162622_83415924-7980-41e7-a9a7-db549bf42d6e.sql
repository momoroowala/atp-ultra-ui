-- Step 1: Create tiers table
CREATE TABLE public.tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  tier_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view active tiers"
  ON public.tiers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage tiers"
  ON public.tiers FOR ALL
  USING (is_admin(auth.uid()));

-- Create indexes
CREATE INDEX idx_tiers_tier_key ON public.tiers(tier_key);
CREATE INDEX idx_tiers_is_active ON public.tiers(is_active);

-- Insert default tiers
INSERT INTO public.tiers (tier_key, display_name, description, tier_order) VALUES
  ('all', 'All Tiers', 'Visible to all users regardless of tier', 0),
  ('client_stb', 'STB Client', 'Smart Trading Blueprint standard client', 1),
  ('client_midticket', 'Mid-Ticket Client', 'Mid-ticket program client', 2),
  ('client_stb_tester', 'STB Tester', 'Beta testing tier', 3),
  ('free', 'Free', 'Free tier access', 4),
  ('basic', 'Basic', 'Basic tier access', 5),
  ('premium', 'Premium', 'Premium tier access', 6),
  ('elite', 'Elite', 'Elite tier access', 7);

-- Step 2: Update user_profiles table
ALTER TABLE public.user_profiles 
  ADD COLUMN tier_id UUID REFERENCES public.tiers(id);

CREATE INDEX idx_user_profiles_tier_id ON public.user_profiles(tier_id);

-- Migrate existing tier data to tier_id
UPDATE public.user_profiles up
SET tier_id = t.id
FROM public.tiers t
WHERE up.tier = t.tier_key AND up.tier IS NOT NULL;

-- Set default tier for users without one
UPDATE public.user_profiles up
SET tier_id = (SELECT id FROM public.tiers WHERE tier_key = 'client_stb')
WHERE tier_id IS NULL;

-- Step 3: Add visible_tier_ids to courses
ALTER TABLE public.courses ADD COLUMN visible_tier_ids UUID[];
CREATE INDEX idx_courses_visible_tier_ids ON public.courses USING GIN(visible_tier_ids);

UPDATE public.courses c
SET visible_tier_ids = (
  SELECT ARRAY_AGG(t.id)
  FROM unnest(c.visible_tiers) AS vt
  JOIN public.tiers t ON t.tier_key = vt
)
WHERE visible_tiers IS NOT NULL AND array_length(visible_tiers, 1) > 0;

-- Step 4: Add visible_tier_ids to phases
ALTER TABLE public.phases ADD COLUMN visible_tier_ids UUID[];
CREATE INDEX idx_phases_visible_tier_ids ON public.phases USING GIN(visible_tier_ids);

UPDATE public.phases p
SET visible_tier_ids = (
  SELECT ARRAY_AGG(t.id)
  FROM unnest(p.visible_tiers) AS vt
  JOIN public.tiers t ON t.tier_key = vt
)
WHERE visible_tiers IS NOT NULL AND array_length(visible_tiers, 1) > 0;

-- Step 5: Add visible_tier_ids to tasks
ALTER TABLE public.tasks ADD COLUMN visible_tier_ids UUID[];
CREATE INDEX idx_tasks_visible_tier_ids ON public.tasks USING GIN(visible_tier_ids);

UPDATE public.tasks t
SET visible_tier_ids = (
  SELECT ARRAY_AGG(tiers.id)
  FROM unnest(t.visible_tiers) AS vt
  JOIN public.tiers ON tiers.tier_key = vt
)
WHERE visible_tiers IS NOT NULL AND array_length(visible_tiers, 1) > 0;

-- Step 6: Add visible_tier_ids to calendar_calls
ALTER TABLE public.calendar_calls ADD COLUMN visible_tier_ids UUID[];
CREATE INDEX idx_calendar_calls_visible_tier_ids ON public.calendar_calls USING GIN(visible_tier_ids);

UPDATE public.calendar_calls cc
SET visible_tier_ids = (
  SELECT ARRAY_AGG(t.id)
  FROM unnest(cc.visible_tiers) AS vt
  JOIN public.tiers t ON t.tier_key = vt
)
WHERE visible_tiers IS NOT NULL AND array_length(visible_tiers, 1) > 0;

-- Step 7: Add visible_tier_ids to call_recordings
ALTER TABLE public.call_recordings ADD COLUMN visible_tier_ids UUID[];
CREATE INDEX idx_call_recordings_visible_tier_ids ON public.call_recordings USING GIN(visible_tier_ids);

UPDATE public.call_recordings cr
SET visible_tier_ids = (
  SELECT ARRAY_AGG(t.id)
  FROM unnest(cr.visible_tiers) AS vt
  JOIN public.tiers t ON t.tier_key = vt
)
WHERE visible_tiers IS NOT NULL AND array_length(visible_tiers, 1) > 0;

-- Step 8: Update has_course_access function
CREATE OR REPLACE FUNCTION public.has_course_access(_user_id UUID, _course_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  course_visible_tier_ids UUID[];
  user_tier_id UUID;
  has_individual_access BOOLEAN;
  all_tier_id UUID;
BEGIN
  SELECT id INTO all_tier_id FROM tiers WHERE tier_key = 'all';

  SELECT visible_tier_ids INTO course_visible_tier_ids
  FROM courses
  WHERE id = _course_id;

  IF all_tier_id = ANY(course_visible_tier_ids) THEN
    RETURN TRUE;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM user_course_access
    WHERE user_id = _user_id AND course_id = _course_id
  ) INTO has_individual_access;

  IF has_individual_access THEN
    RETURN TRUE;
  END IF;

  SELECT tier_id INTO user_tier_id
  FROM user_profiles
  WHERE id = _user_id;

  IF user_tier_id IS NULL THEN
    SELECT t.id INTO user_tier_id
    FROM user_roles ur
    JOIN tiers t ON t.tier_key = ur.role::text
    WHERE ur.user_id = _user_id
    LIMIT 1;
  END IF;

  RETURN user_tier_id = ANY(course_visible_tier_ids);
END;
$$;

-- Step 9: Update calendar_calls RLS policy
DROP POLICY IF EXISTS "Users can view accessible calls" ON public.calendar_calls;

CREATE POLICY "Users can view accessible calls"
ON public.calendar_calls
FOR SELECT
USING (
  is_active = true 
  AND (
    is_admin(auth.uid()) OR
    visible_tier_ids IS NULL OR
    array_length(visible_tier_ids, 1) IS NULL OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND tier_id = ANY(calendar_calls.visible_tier_ids)
    ) OR
    EXISTS (
      SELECT 1 FROM tiers
      WHERE tier_key = 'all'
      AND id = ANY(calendar_calls.visible_tier_ids)
    )
  )
);

-- Step 10: Update call_recordings RLS policy
DROP POLICY IF EXISTS "Users can view accessible recordings" ON public.call_recordings;

CREATE POLICY "Users can view accessible recordings"
ON public.call_recordings
FOR SELECT
USING (
  is_active = true 
  AND (
    is_admin(auth.uid()) OR
    visible_tier_ids IS NULL OR
    array_length(visible_tier_ids, 1) IS NULL OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND tier_id = ANY(call_recordings.visible_tier_ids)
    ) OR
    EXISTS (
      SELECT 1 FROM tiers
      WHERE tier_key = 'all'
      AND id = ANY(call_recordings.visible_tier_ids)
    )
  )
);

-- Step 11: Update phases RLS policy
DROP POLICY IF EXISTS "Users can view unlocked phases based on tier and unlock status" ON public.phases;

CREATE POLICY "Users can view unlocked phases based on tier and unlock status"
ON public.phases
FOR SELECT
USING (
  is_active = true 
  AND (
    EXISTS (
      SELECT 1 FROM tiers
      WHERE tier_key = 'all'
      AND id = ANY(phases.visible_tier_ids)
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND tier_id = ANY(phases.visible_tier_ids)
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN tiers t ON t.tier_key = ur.role::text
      WHERE ur.user_id = auth.uid()
      AND t.id = ANY(phases.visible_tier_ids)
    )
  )
  AND is_phase_unlocked(id, auth.uid())
);

-- Step 12: Update tasks RLS policy
DROP POLICY IF EXISTS "Users can view unlocked tasks based on tier and unlock status" ON public.tasks;

CREATE POLICY "Users can view unlocked tasks based on tier and unlock status"
ON public.tasks
FOR SELECT
USING (
  is_active = true 
  AND (
    EXISTS (
      SELECT 1 FROM tiers
      WHERE tier_key = 'all'
      AND id = ANY(tasks.visible_tier_ids)
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND tier_id = ANY(tasks.visible_tier_ids)
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN tiers t ON t.tier_key = ur.role::text
      WHERE ur.user_id = auth.uid()
      AND t.id = ANY(tasks.visible_tier_ids)
    )
  )
  AND is_task_unlocked(id, auth.uid())
);
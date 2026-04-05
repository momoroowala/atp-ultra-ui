-- Add created_at to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Backfill created_at from auth.users for existing profiles
UPDATE public.user_profiles up
SET created_at = au.created_at
FROM auth.users au
WHERE up.id = au.id AND up.created_at IS NULL;

-- Create function to check if a phase is unlocked for a user
CREATE OR REPLACE FUNCTION public.is_phase_unlocked(
  _phase_id UUID,
  _user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _phase RECORD;
  _user_created_at TIMESTAMP WITH TIME ZONE;
  _delay_days INTEGER;
  _required_task_id UUID;
  _required_phase_id UUID;
  _is_completed BOOLEAN;
BEGIN
  -- Get phase info
  SELECT * INTO _phase FROM phases WHERE id = _phase_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Get user creation date
  SELECT created_at INTO _user_created_at 
  FROM user_profiles 
  WHERE id = _user_id;
  
  IF _user_created_at IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check unlock type
  CASE _phase.unlock_type
    WHEN 'time' THEN
      -- Time-based: check if delay_days have passed since user joined
      _delay_days := COALESCE((_phase.unlock_condition->>'delay_days')::INTEGER, 0);
      RETURN CURRENT_DATE >= (_user_created_at::DATE + _delay_days);
    
    WHEN 'previous_task' THEN
      -- Get the previous task/phase ID from unlock_condition
      _required_task_id := (_phase.unlock_condition->>'task_id')::UUID;
      IF _required_task_id IS NOT NULL THEN
        SELECT EXISTS(
          SELECT 1 FROM task_responses 
          WHERE user_id = _user_id 
            AND task_id = _required_task_id 
            AND status = 'completed'
        ) INTO _is_completed;
        RETURN COALESCE(_is_completed, FALSE);
      END IF;
      -- If no specific task required, always unlock
      RETURN TRUE;
    
    WHEN 'completion' THEN
      -- Check if specific phase is completed
      _required_phase_id := (_phase.unlock_condition->>'phase_id')::UUID;
      IF _required_phase_id IS NOT NULL THEN
        -- Check if all tasks in required phase are completed
        SELECT NOT EXISTS(
          SELECT 1 FROM tasks t
          WHERE t.phase_id = _required_phase_id 
            AND t.is_active = true
            AND NOT EXISTS(
              SELECT 1 FROM task_responses tr
              WHERE tr.task_id = t.id
                AND tr.user_id = _user_id
                AND tr.status = 'completed'
            )
        ) INTO _is_completed;
        RETURN COALESCE(_is_completed, FALSE);
      END IF;
      RETURN TRUE;
    
    ELSE
      RETURN TRUE;
  END CASE;
END;
$$;

-- Create function to check if a task is unlocked for a user
CREATE OR REPLACE FUNCTION public.is_task_unlocked(
  _task_id UUID,
  _user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _task RECORD;
  _user_created_at TIMESTAMP WITH TIME ZONE;
  _delay_days INTEGER;
  _required_task_id UUID;
  _is_completed BOOLEAN;
BEGIN
  -- Get task info
  SELECT * INTO _task FROM tasks WHERE id = _task_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Get user creation date
  SELECT created_at INTO _user_created_at 
  FROM user_profiles 
  WHERE id = _user_id;
  
  IF _user_created_at IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check unlock type
  CASE _task.unlock_type
    WHEN 'time' THEN
      -- Time-based: check if delay_days have passed since user joined
      _delay_days := COALESCE((_task.content->>'delay_days')::INTEGER, 0);
      RETURN CURRENT_DATE >= (_user_created_at::DATE + _delay_days);
    
    WHEN 'previous_task' THEN
      -- Get the previous task ID from content
      _required_task_id := (_task.content->>'required_task_id')::UUID;
      IF _required_task_id IS NOT NULL THEN
        SELECT EXISTS(
          SELECT 1 FROM task_responses 
          WHERE user_id = _user_id 
            AND task_id = _required_task_id 
            AND status = 'completed'
        ) INTO _is_completed;
        RETURN COALESCE(_is_completed, FALSE);
      END IF;
      -- If no specific task required, always unlock
      RETURN TRUE;
    
    WHEN 'completion' THEN
      -- Check if specific task is completed
      _required_task_id := (_task.content->>'required_task_id')::UUID;
      IF _required_task_id IS NOT NULL THEN
        SELECT EXISTS(
          SELECT 1 FROM task_responses 
          WHERE user_id = _user_id 
            AND task_id = _required_task_id 
            AND status = 'completed'
        ) INTO _is_completed;
        RETURN COALESCE(_is_completed, FALSE);
      END IF;
      RETURN TRUE;
    
    ELSE
      RETURN TRUE;
  END CASE;
END;
$$;

-- Update RLS policy for phases to include unlock check
DROP POLICY IF EXISTS "Everyone can view active phases" ON public.phases;

CREATE POLICY "Users can view unlocked phases based on tier and unlock status"
ON public.phases
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND (
    'all' = ANY(visible_tiers) 
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role::text = ANY(visible_tiers)
    )
  )
  AND is_phase_unlocked(id, auth.uid())
);

-- Update RLS policy for tasks to include unlock check
DROP POLICY IF EXISTS "Everyone can view active tasks" ON public.tasks;

CREATE POLICY "Users can view unlocked tasks based on tier and unlock status"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND (
    'all' = ANY(visible_tiers) 
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role::text = ANY(visible_tiers)
    )
  )
  AND is_task_unlocked(id, auth.uid())
);
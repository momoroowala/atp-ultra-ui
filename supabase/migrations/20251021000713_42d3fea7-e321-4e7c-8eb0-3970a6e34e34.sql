-- Update is_task_unlocked function to respect phase unlock strategy
CREATE OR REPLACE FUNCTION public.is_task_unlocked(_task_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _task RECORD;
  _phase RECORD;
  _user_created_at TIMESTAMP WITH TIME ZONE;
  _task_unlock_strategy TEXT;
  _previous_task_id UUID;
  _is_completed BOOLEAN;
BEGIN
  -- Get task info
  SELECT * INTO _task FROM tasks WHERE id = _task_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Get parent phase info
  SELECT * INTO _phase FROM phases WHERE id = _task.phase_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- First check if the phase is unlocked
  IF NOT is_phase_unlocked(_task.phase_id, _user_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Get the task unlock strategy from phase unlock_condition
  _task_unlock_strategy := COALESCE((_phase.unlock_condition->>'task_unlock_strategy')::TEXT, 'all_at_once');
  
  -- If strategy is "all_at_once", task is unlocked when phase is unlocked
  IF _task_unlock_strategy = 'all_at_once' THEN
    RETURN TRUE;
  END IF;
  
  -- If strategy is "sequential", check if previous task is completed
  IF _task_unlock_strategy = 'sequential' THEN
    -- Find the previous task in the same phase
    SELECT id INTO _previous_task_id
    FROM tasks
    WHERE phase_id = _task.phase_id
      AND is_active = true
      AND task_order < _task.task_order
    ORDER BY task_order DESC
    LIMIT 1;
    
    -- If no previous task, this is the first task, so it's unlocked
    IF _previous_task_id IS NULL THEN
      RETURN TRUE;
    END IF;
    
    -- Check if previous task is completed
    SELECT EXISTS(
      SELECT 1 FROM task_responses 
      WHERE user_id = _user_id 
        AND task_id = _previous_task_id 
        AND status = 'completed'
    ) INTO _is_completed;
    
    RETURN COALESCE(_is_completed, FALSE);
  END IF;
  
  -- Default: unlock
  RETURN TRUE;
END;
$function$;
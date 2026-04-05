-- Replace check_phase_base_conditions to read unlock_condition JSON with legacy fallbacks
CREATE OR REPLACE FUNCTION public.check_phase_base_conditions(_phase_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  phase_record phases%ROWTYPE;
  user_created_at timestamptz;
  delay_days integer;
  required_phase_id uuid;
  required_task_id uuid;
BEGIN
  -- Get the phase
  SELECT * INTO phase_record FROM phases WHERE id = _phase_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Derive common params from JSON first, then legacy columns
  delay_days := COALESCE((phase_record.unlock_condition->>'delay_days')::int, phase_record.unlock_delay_days, 0);
  required_phase_id := COALESCE((phase_record.unlock_condition->>'phase_id')::uuid, phase_record.required_phase_id);
  required_task_id := (phase_record.unlock_condition->>'task_id')::uuid;

  -- Evaluate base conditions ignoring quiz gating
  CASE phase_record.unlock_type
    WHEN 'immediate' THEN
      RETURN true;

    WHEN 'time' THEN
      -- Use auth.users for accurate join date
      SELECT created_at INTO user_created_at 
      FROM auth.users 
      WHERE id = _user_id;

      IF user_created_at IS NULL THEN
        RETURN false;
      END IF;

      RETURN CURRENT_DATE >= (user_created_at::date + delay_days);

    WHEN 'completion' THEN
      IF required_phase_id IS NULL THEN
        RETURN false;
      END IF;

      -- All active tasks in required phase must be completed by the user
      RETURN NOT EXISTS (
        SELECT 1
        FROM tasks t
        WHERE t.phase_id = required_phase_id
          AND t.is_active = true
          AND NOT EXISTS (
            SELECT 1 FROM task_responses tr
            WHERE tr.task_id = t.id
              AND tr.user_id = _user_id
              AND tr.status = 'completed'
          )
      );

    WHEN 'previous_task' THEN
      -- If a specific prior task is provided, require it; otherwise treat as satisfied
      IF required_task_id IS NULL THEN
        RETURN true;
      END IF;

      RETURN EXISTS (
        SELECT 1 FROM task_responses tr
        WHERE tr.task_id = required_task_id
          AND tr.user_id = _user_id
          AND tr.status = 'completed'
      );

    ELSE
      -- Default: treat as satisfied (lets UI/quiz gating handle final unlock)
      RETURN true;
  END CASE;
END;
$$;
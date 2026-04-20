-- Create function to check only base unlock conditions (without quiz requirement)
CREATE OR REPLACE FUNCTION check_phase_base_conditions(_phase_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  phase_record phases%ROWTYPE;
  required_phase_record phases%ROWTYPE;
  user_created_at timestamp with time zone;
  days_since_join integer;
BEGIN
  -- Get the phase
  SELECT * INTO phase_record FROM phases WHERE id = _phase_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check unlock type
  CASE phase_record.unlock_type
    WHEN 'immediate' THEN
      RETURN true;
      
    WHEN 'time_based' THEN
      -- Get user's created_at from auth.users
      SELECT created_at INTO user_created_at 
      FROM auth.users 
      WHERE id = _user_id;
      
      -- Calculate days since user joined
      days_since_join := EXTRACT(DAY FROM (NOW() - user_created_at));
      
      -- Check if enough days have passed
      RETURN days_since_join >= COALESCE(phase_record.unlock_delay_days, 0);
      
    WHEN 'previous_phase' THEN
      IF phase_record.required_phase_id IS NULL THEN
        RETURN false;
      END IF;
      
      -- Get the required phase
      SELECT * INTO required_phase_record 
      FROM phases 
      WHERE id = phase_record.required_phase_id;
      
      IF NOT FOUND THEN
        RETURN false;
      END IF;
      
      -- Check if all tasks in the required phase are completed
      RETURN NOT EXISTS (
        SELECT 1
        FROM tasks t
        WHERE t.phase_id = phase_record.required_phase_id
          AND t.is_active = true
          AND NOT EXISTS (
            SELECT 1
            FROM task_responses tr
            WHERE tr.task_id = t.id
              AND tr.user_id = _user_id
              AND tr.status = 'completed'
          )
      );
      
    WHEN 'previous_task' THEN
      -- Check if there's a previous task that needs to be completed
      -- Find the previous task in sequence
      RETURN NOT EXISTS (
        SELECT 1
        FROM tasks prev_task
        WHERE prev_task.phase_id = phase_record.id
          AND prev_task.is_active = true
          AND prev_task.task_order < (
            SELECT MIN(task_order)
            FROM tasks
            WHERE phase_id = phase_record.id
              AND is_active = true
          )
          AND NOT EXISTS (
            SELECT 1
            FROM task_responses tr
            WHERE tr.task_id = prev_task.id
              AND tr.user_id = _user_id
              AND tr.status = 'completed'
          )
      );
      
    ELSE
      RETURN false;
  END CASE;
END;
$$;
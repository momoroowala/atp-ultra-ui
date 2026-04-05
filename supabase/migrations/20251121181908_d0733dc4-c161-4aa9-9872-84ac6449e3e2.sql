-- Add skipped field to habit_completions table
ALTER TABLE habit_completions
ADD COLUMN IF NOT EXISTS skipped boolean DEFAULT false;

-- Drop and recreate the get_today_habits function to include skipped status
DROP FUNCTION IF EXISTS get_today_habits(uuid);

CREATE FUNCTION get_today_habits(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  habit_name text,
  icon_name text,
  completed boolean,
  skipped boolean,
  current_streak integer,
  notes text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uh.id,
    uh.habit_name,
    uh.icon_name,
    COALESCE(hc.completed, false) as completed,
    COALESCE(hc.skipped, false) as skipped,
    COALESCE(hs.current_streak, 0) as current_streak,
    hc.notes
  FROM user_habits uh
  LEFT JOIN habit_completions hc 
    ON uh.id = hc.user_habit_id 
    AND hc.completion_date = CURRENT_DATE
    AND hc.user_id = p_user_id
  LEFT JOIN habit_streaks hs 
    ON uh.id = hs.user_habit_id
    AND hs.user_id = p_user_id
  WHERE uh.user_id = p_user_id
    AND uh.is_active = true
  ORDER BY uh.order_index;
END;
$$;

-- Create function to toggle habit skip status
CREATE OR REPLACE FUNCTION toggle_habit_skip(
  p_user_id uuid,
  p_user_habit_id uuid,
  p_completion_date date DEFAULT CURRENT_DATE
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_completion_record habit_completions%ROWTYPE;
  v_new_skipped boolean;
BEGIN
  -- Get or create the completion record
  SELECT * INTO v_completion_record
  FROM habit_completions
  WHERE user_id = p_user_id
    AND user_habit_id = p_user_habit_id
    AND completion_date = p_completion_date;

  IF NOT FOUND THEN
    -- Create new record with skipped = true
    INSERT INTO habit_completions (user_id, user_habit_id, completion_date, completed, skipped)
    VALUES (p_user_id, p_user_habit_id, p_completion_date, false, true)
    RETURNING * INTO v_completion_record;
    v_new_skipped := true;
  ELSE
    -- Toggle skipped status
    v_new_skipped := NOT COALESCE(v_completion_record.skipped, false);
    
    -- If toggling to skipped, set completed to false
    UPDATE habit_completions
    SET 
      skipped = v_new_skipped,
      completed = CASE WHEN v_new_skipped THEN false ELSE completed END,
      updated_at = now()
    WHERE id = v_completion_record.id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'skipped', v_new_skipped
  );
END;
$$;
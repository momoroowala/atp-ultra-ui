-- Drop and recreate get_today_habits with updated return type
DROP FUNCTION IF EXISTS public.get_today_habits(uuid);

CREATE FUNCTION public.get_today_habits(p_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_habit_id uuid,
  habit_name text,
  icon_name text,
  completed boolean,
  skipped boolean,
  current_streak integer,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(hc.id, gen_random_uuid()) as id,  -- completion_id
    uh.id as user_habit_id,
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
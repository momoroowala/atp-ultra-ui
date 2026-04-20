-- Fix the seed function to reactivate habits instead of ignoring them
CREATE OR REPLACE FUNCTION public.seed_user_default_habits(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO user_custom_habits (user_id, task_name, description, order_index)
  SELECT _user_id, task_name, description, order_index
  FROM habit_tracker_tasks
  WHERE is_active = true
  ON CONFLICT (user_id, task_name) 
  DO UPDATE SET 
    is_active = true, 
    order_index = EXCLUDED.order_index,
    description = EXCLUDED.description,
    updated_at = NOW();
END;
$function$;

-- Create atomic reset function that handles everything in one call
CREATE OR REPLACE FUNCTION public.reset_user_habits_to_defaults(_user_id uuid)
RETURNS SETOF user_custom_habits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Security check
  IF _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Deactivate all current habits
  UPDATE user_custom_habits
  SET is_active = false, updated_at = NOW()
  WHERE user_id = _user_id;

  -- Seed/reactivate defaults
  PERFORM seed_user_default_habits(_user_id);

  -- Return the active habits
  RETURN QUERY
  SELECT * FROM user_custom_habits
  WHERE user_id = _user_id AND is_active = true
  ORDER BY order_index;
END;
$function$;

-- Add index for faster daily habit lookups
CREATE INDEX IF NOT EXISTS idx_user_habit_completions_user_date 
ON user_habit_completions(user_id, assigned_date);
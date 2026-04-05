-- Drop and recreate toggle_habit_completion to handle missing records
DROP FUNCTION IF EXISTS public.toggle_habit_completion(uuid, uuid);

CREATE OR REPLACE FUNCTION public.toggle_habit_completion(
  p_user_habit_id uuid,
  p_user_id uuid,
  p_completion_date date DEFAULT CURRENT_DATE
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_completion_id UUID;
  v_new_completed BOOLEAN;
BEGIN
  -- Get or create completion record
  INSERT INTO public.habit_completions (user_id, user_habit_id, completion_date, completed, skipped)
  VALUES (p_user_id, p_user_habit_id, p_completion_date, true, false)
  ON CONFLICT (user_id, user_habit_id, completion_date) 
  DO UPDATE SET 
    completed = NOT habit_completions.completed,
    completed_at = CASE WHEN NOT habit_completions.completed THEN now() ELSE NULL END,
    skipped = false,
    updated_at = now()
  RETURNING id, completed INTO v_completion_id, v_new_completed;

  -- Update streak
  PERFORM public.update_habit_streak(p_user_id, p_user_habit_id);

  -- Check for badge achievements
  PERFORM public.check_and_award_badges(p_user_id);

  -- Return updated completion
  RETURN json_build_object(
    'id', v_completion_id,
    'completed', v_new_completed,
    'user_habit_id', p_user_habit_id
  );
END;
$function$;
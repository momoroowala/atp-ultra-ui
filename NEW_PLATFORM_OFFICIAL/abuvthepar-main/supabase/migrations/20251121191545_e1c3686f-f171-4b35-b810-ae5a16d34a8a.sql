-- Update toggle_habit_completion to handle skipped flag
CREATE OR REPLACE FUNCTION public.toggle_habit_completion(
  p_completion_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_completion RECORD;
  v_new_completed BOOLEAN;
BEGIN
  -- Get and verify ownership
  SELECT * INTO v_completion
  FROM public.habit_completions
  WHERE id = p_completion_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Completion not found or access denied';
  END IF;

  -- Toggle completed status
  v_new_completed := NOT v_completion.completed;
  
  UPDATE public.habit_completions
  SET 
    completed = v_new_completed,
    completed_at = CASE WHEN v_new_completed THEN now() ELSE NULL END,
    skipped = false,  -- Reset skipped when toggling completion
    updated_at = now()
  WHERE id = p_completion_id;

  -- Update streak
  PERFORM public.update_habit_streak(p_user_id, v_completion.user_habit_id);

  -- Check for badge achievements
  PERFORM public.check_and_award_badges(p_user_id);

  -- Return updated completion
  RETURN json_build_object(
    'id', p_completion_id,
    'completed', v_new_completed,
    'completed_at', CASE WHEN v_new_completed THEN now() ELSE NULL END,
    'skipped', false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
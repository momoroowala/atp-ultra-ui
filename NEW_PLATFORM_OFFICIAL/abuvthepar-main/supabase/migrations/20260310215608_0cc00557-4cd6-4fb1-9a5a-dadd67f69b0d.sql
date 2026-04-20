-- Recreate check_and_award_achievement_badges without trade_records references
CREATE OR REPLACE FUNCTION public.check_and_award_achievement_badges(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_badge RECORD; v_completed_tasks INTEGER; v_total_tasks INTEGER;
  v_trade_count INTEGER := 0; v_green_days INTEGER := 0; v_quiz_passed_count INTEGER; v_completion_percent NUMERIC;
BEGIN
  SELECT COUNT(*) INTO v_completed_tasks FROM task_responses WHERE user_id = p_user_id AND status = 'completed';
  SELECT COUNT(*) INTO v_total_tasks FROM tasks WHERE is_active = true;
  SELECT COUNT(*) INTO v_quiz_passed_count FROM quiz_submissions WHERE user_id = p_user_id AND passed = true;
  FOR v_badge IN SELECT * FROM achievement_badges WHERE auto_award = true AND is_active = true LOOP
    CASE v_badge.requirement_type
      WHEN 'task_completion_percent' THEN
        IF v_total_tasks > 0 THEN
          v_completion_percent := (v_completed_tasks::NUMERIC / v_total_tasks::NUMERIC) * 100;
          IF v_completion_percent >= (v_badge.requirement_value->>'percent')::NUMERIC THEN
            INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
          END IF;
        END IF;
      WHEN 'first_login' THEN INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
      WHEN 'onboarding_complete' THEN
        IF EXISTS (SELECT 1 FROM user_milestones WHERE user_id = p_user_id AND milestone_type = 'onboarding_complete' AND completed = true) THEN
          INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;
      WHEN 'first_trade' THEN IF v_trade_count >= 1 THEN INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING; END IF;
      WHEN 'trade_count' THEN IF v_trade_count >= (v_badge.requirement_value->>'count')::INTEGER THEN INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING; END IF;
      WHEN 'green_day' THEN IF v_green_days >= (v_badge.requirement_value->>'days')::INTEGER THEN INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING; END IF;
      WHEN 'quiz_passed' THEN IF v_quiz_passed_count >= (v_badge.requirement_value->>'count')::INTEGER THEN INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING; END IF;
      WHEN 'login_streak' THEN
        IF EXISTS (SELECT 1 FROM user_login_streaks WHERE user_id = p_user_id AND current_streak >= (v_badge.requirement_value->>'days')::INTEGER) THEN
          INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;
    END CASE;
  END LOOP;
END;
$function$;
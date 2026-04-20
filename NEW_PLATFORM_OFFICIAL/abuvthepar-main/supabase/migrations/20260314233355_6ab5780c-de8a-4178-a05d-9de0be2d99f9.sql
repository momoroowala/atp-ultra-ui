-- Schema compatibility safeguard: rename earned_at to awarded_at if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_achievement_badges' AND column_name = 'earned_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_achievement_badges' AND column_name = 'awarded_at'
  ) THEN
    ALTER TABLE public.user_achievement_badges RENAME COLUMN earned_at TO awarded_at;
    RAISE NOTICE 'Renamed user_achievement_badges.earned_at to awarded_at';
  END IF;
END $$;

-- Recreate badge awarding function with ELSE clause and additional requirement_type handlers
CREATE OR REPLACE FUNCTION public.check_and_award_achievement_badges(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_badge RECORD;
  v_completed_tasks INTEGER;
  v_total_tasks INTEGER;
  v_quiz_passed_count INTEGER;
  v_completion_percent NUMERIC;
  v_message_count INTEGER;
  v_reaction_count INTEGER;
  v_thread_reply_count INTEGER;
  v_lead_count INTEGER;
  v_active_days INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_completed_tasks FROM task_responses WHERE user_id = p_user_id AND status = 'completed';
  SELECT COUNT(*) INTO v_total_tasks FROM tasks WHERE is_active = true;
  SELECT COUNT(*) INTO v_quiz_passed_count FROM quiz_submissions WHERE user_id = p_user_id AND passed = true;
  SELECT COUNT(*) INTO v_message_count FROM community_messages WHERE sender_id = p_user_id AND is_deleted IS NOT TRUE;
  SELECT COUNT(*) INTO v_reaction_count FROM community_message_reactions WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_thread_reply_count FROM community_messages WHERE sender_id = p_user_id AND parent_message_id IS NOT NULL AND is_deleted IS NOT TRUE;
  SELECT COUNT(*) INTO v_lead_count FROM brand_leads WHERE user_id = p_user_id;
  SELECT total_logins INTO v_active_days FROM user_login_streaks WHERE user_id = p_user_id;
  v_active_days := COALESCE(v_active_days, 0);

  FOR v_badge IN SELECT * FROM achievement_badges WHERE auto_award = true AND is_active = true LOOP
    CASE v_badge.requirement_type
      WHEN 'task_completion_percent' THEN
        IF v_total_tasks > 0 THEN
          v_completion_percent := (v_completed_tasks::NUMERIC / v_total_tasks::NUMERIC) * 100;
          IF v_completion_percent >= (v_badge.requirement_value->>'percent')::NUMERIC THEN
            INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
          END IF;
        END IF;

      WHEN 'first_login' THEN
        INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;

      WHEN 'onboarding_complete' THEN
        IF EXISTS (SELECT 1 FROM user_milestones WHERE user_id = p_user_id AND milestone_type = 'onboarding_complete' AND completed = true) THEN
          INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;

      WHEN 'quiz_passed', 'quizzes_passed' THEN
        IF v_quiz_passed_count >= COALESCE((v_badge.requirement_value->>'count')::INTEGER, 1) THEN
          INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;

      WHEN 'login_streak' THEN
        IF EXISTS (SELECT 1 FROM user_login_streaks WHERE user_id = p_user_id AND current_streak >= (v_badge.requirement_value->>'days')::INTEGER) THEN
          INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;

      WHEN 'tasks_submitted' THEN
        IF v_completed_tasks >= COALESCE((v_badge.requirement_value->>'count')::INTEGER, 1) THEN
          INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;

      WHEN 'messages_sent' THEN
        IF v_message_count >= COALESCE((v_badge.requirement_value->>'count')::INTEGER, 1) THEN
          INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;

      WHEN 'reactions_given' THEN
        IF v_reaction_count >= COALESCE((v_badge.requirement_value->>'count')::INTEGER, 1) THEN
          INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;

      WHEN 'thread_replies' THEN
        IF v_thread_reply_count >= COALESCE((v_badge.requirement_value->>'count')::INTEGER, 1) THEN
          INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;

      WHEN 'leads_created' THEN
        IF v_lead_count >= COALESCE((v_badge.requirement_value->>'count')::INTEGER, 1) THEN
          INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;

      WHEN 'active_days' THEN
        IF v_active_days >= COALESCE((v_badge.requirement_value->>'count')::INTEGER, 1) THEN
          INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;

      ELSE
        NULL;
    END CASE;
  END LOOP;
END;
$function$;
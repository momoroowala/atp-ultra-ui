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
  v_perfect_quiz_count INTEGER;
  v_phases_completed INTEGER;
  v_courses_completed INTEGER;
  v_user_created_at TIMESTAMPTZ;
  v_category_count INTEGER;
  v_total_categories INTEGER;
  v_days INTEGER;
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
  SELECT COUNT(*) INTO v_perfect_quiz_count FROM quiz_submissions WHERE user_id = p_user_id AND passed = true AND score = 100;
  SELECT created_at INTO v_user_created_at FROM user_profiles WHERE id = p_user_id;

  SELECT COUNT(*) INTO v_phases_completed
  FROM phases p
  WHERE p.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.phase_id = p.id AND t.is_active = true
        AND NOT EXISTS (
          SELECT 1 FROM task_responses tr
          WHERE tr.task_id = t.id AND tr.user_id = p_user_id AND tr.status = 'completed'
        )
    )
    AND EXISTS (SELECT 1 FROM tasks t2 WHERE t2.phase_id = p.id AND t2.is_active = true);

  SELECT COUNT(*) INTO v_courses_completed
  FROM courses c
  WHERE c.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM phases p
      JOIN tasks t ON t.phase_id = p.id
      WHERE p.course_id = c.id AND p.is_active = true AND t.is_active = true
        AND NOT EXISTS (
          SELECT 1 FROM task_responses tr
          WHERE tr.task_id = t.id AND tr.user_id = p_user_id AND tr.status = 'completed'
        )
    )
    AND EXISTS (SELECT 1 FROM phases p2 JOIN tasks t2 ON t2.phase_id = p2.id WHERE p2.course_id = c.id AND p2.is_active = true AND t2.is_active = true);

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

      WHEN 'perfect_quiz_score' THEN
        IF v_perfect_quiz_count >= COALESCE((v_badge.requirement_value->>'count')::INTEGER, 1) THEN
          INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;

      WHEN 'phases_completed' THEN
        IF v_phases_completed >= COALESCE((v_badge.requirement_value->>'count')::INTEGER, 1) THEN
          INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;

      WHEN 'courses_completed' THEN
        IF v_courses_completed >= COALESCE((v_badge.requirement_value->>'count')::INTEGER, 1) THEN
          INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;

      WHEN 'course_progress' THEN
        IF v_total_tasks > 0 THEN
          v_completion_percent := (v_completed_tasks::NUMERIC / v_total_tasks::NUMERIC) * 100;
          IF v_completion_percent >= COALESCE((v_badge.requirement_value->>'percent')::NUMERIC, 50) THEN
            INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
          END IF;
        END IF;

      WHEN 'lessons_completed' THEN
        IF v_completed_tasks >= COALESCE((v_badge.requirement_value->>'count')::INTEGER, 1) THEN
          INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;

      WHEN 'early_submission' THEN
        IF v_user_created_at IS NOT NULL AND EXISTS (
          SELECT 1 FROM task_responses
          WHERE user_id = p_user_id AND status = 'completed'
            AND created_at <= v_user_created_at + INTERVAL '24 hours'
        ) THEN
          INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;

      WHEN 'fast_phase_completion' THEN
        IF v_user_created_at IS NOT NULL THEN
          v_days := COALESCE((v_badge.requirement_value->>'days')::INTEGER, 3);
          IF EXISTS (
            SELECT 1 FROM phases p
            WHERE p.is_active = true
              AND EXISTS (SELECT 1 FROM tasks t WHERE t.phase_id = p.id AND t.is_active = true)
              AND NOT EXISTS (
                SELECT 1 FROM tasks t
                WHERE t.phase_id = p.id AND t.is_active = true
                  AND NOT EXISTS (
                    SELECT 1 FROM task_responses tr
                    WHERE tr.task_id = t.id AND tr.user_id = p_user_id AND tr.status = 'completed'
                      AND tr.created_at <= v_user_created_at + (v_days || ' days')::INTERVAL
                  )
              )
          ) THEN
            INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
          END IF;
        END IF;

      WHEN 'all_categories' THEN
        SELECT COUNT(DISTINCT category) INTO v_total_categories FROM achievement_badges WHERE is_active = true;
        SELECT COUNT(DISTINCT ab.category) INTO v_category_count
        FROM user_achievement_badges uab
        JOIN achievement_badges ab ON ab.id = uab.badge_id
        WHERE uab.user_id = p_user_id AND ab.is_active = true;
        IF v_category_count >= v_total_categories AND v_total_categories > 0 THEN
          INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;

      ELSE
        NULL;
    END CASE;
  END LOOP;
END;
$function$;
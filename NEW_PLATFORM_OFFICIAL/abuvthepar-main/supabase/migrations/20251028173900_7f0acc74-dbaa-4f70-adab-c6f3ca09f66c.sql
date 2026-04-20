-- Create badge category enum
CREATE TYPE badge_category AS ENUM (
  'onboarding',
  'learning',
  'trading_performance',
  'community',
  'consistency',
  'special'
);

-- Create achievement_badges master table
CREATE TABLE public.achievement_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_key TEXT UNIQUE NOT NULL,
  badge_name TEXT NOT NULL,
  description TEXT,
  category badge_category NOT NULL,
  tier TEXT NOT NULL,
  icon_emoji TEXT DEFAULT '🏆',
  points_value INTEGER DEFAULT 0,
  requirement_type TEXT,
  requirement_value JSONB,
  auto_award BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user achievement tracking table
CREATE TABLE public.user_achievement_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES achievement_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  progress_data JSONB DEFAULT '{}',
  UNIQUE(user_id, badge_id)
);

-- Create user login streaks table
CREATE TABLE public.user_login_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 1,
  longest_streak INTEGER DEFAULT 1,
  last_login_date DATE DEFAULT CURRENT_DATE,
  total_logins INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_user_achievement_badges_user ON user_achievement_badges(user_id);
CREATE INDEX idx_user_achievement_badges_earned ON user_achievement_badges(earned_at DESC);
CREATE INDEX idx_achievement_badges_category ON achievement_badges(category);
CREATE INDEX idx_user_login_streaks_user ON user_login_streaks(user_id);

-- RLS Policies for achievement_badges
ALTER TABLE public.achievement_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active badges"
ON public.achievement_badges
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage badges"
ON public.achievement_badges
FOR ALL
USING (is_admin(auth.uid()));

-- RLS Policies for user_achievement_badges
ALTER TABLE public.user_achievement_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievement badges"
ON public.user_achievement_badges
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievement badges"
ON public.user_achievement_badges
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all achievement badges"
ON public.user_achievement_badges
FOR SELECT
USING (is_admin(auth.uid()));

-- RLS Policies for user_login_streaks
ALTER TABLE public.user_login_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own login streaks"
ON public.user_login_streaks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own login streaks"
ON public.user_login_streaks
FOR ALL
USING (auth.uid() = user_id);

-- Function to check and award achievement badges
CREATE OR REPLACE FUNCTION public.check_and_award_achievement_badges(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_badge RECORD;
  v_completed_tasks INTEGER;
  v_total_tasks INTEGER;
  v_phase_count INTEGER;
  v_completed_phases INTEGER;
  v_trade_count INTEGER;
  v_green_days INTEGER;
  v_quiz_passed_count INTEGER;
  v_homework_count INTEGER;
  v_completion_percent NUMERIC;
BEGIN
  -- Get user stats
  SELECT COUNT(*) INTO v_completed_tasks
  FROM task_responses
  WHERE user_id = p_user_id AND status = 'completed';
  
  SELECT COUNT(*) INTO v_total_tasks
  FROM tasks WHERE is_active = true;
  
  SELECT COUNT(*) INTO v_trade_count
  FROM trade_records
  WHERE user_id = p_user_id;
  
  SELECT COUNT(DISTINCT trade_date) INTO v_green_days
  FROM trade_records
  WHERE user_id = p_user_id AND total_profit > 0;
  
  SELECT COUNT(*) INTO v_quiz_passed_count
  FROM quiz_submissions
  WHERE user_id = p_user_id AND passed = true;
  
  -- Check each badge requirement
  FOR v_badge IN 
    SELECT * FROM achievement_badges 
    WHERE auto_award = true AND is_active = true
  LOOP
    CASE v_badge.requirement_type
      WHEN 'task_completion_percent' THEN
        IF v_total_tasks > 0 THEN
          v_completion_percent := (v_completed_tasks::NUMERIC / v_total_tasks::NUMERIC) * 100;
          IF v_completion_percent >= (v_badge.requirement_value->>'percent')::NUMERIC THEN
            INSERT INTO user_achievement_badges (user_id, badge_id)
            VALUES (p_user_id, v_badge.id)
            ON CONFLICT (user_id, badge_id) DO NOTHING;
          END IF;
        END IF;
      
      WHEN 'first_login' THEN
        INSERT INTO user_achievement_badges (user_id, badge_id)
        VALUES (p_user_id, v_badge.id)
        ON CONFLICT (user_id, badge_id) DO NOTHING;
      
      WHEN 'onboarding_complete' THEN
        IF EXISTS (
          SELECT 1 FROM user_milestones 
          WHERE user_id = p_user_id 
          AND milestone_type = 'onboarding_complete' 
          AND completed = true
        ) THEN
          INSERT INTO user_achievement_badges (user_id, badge_id)
          VALUES (p_user_id, v_badge.id)
          ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;
      
      WHEN 'first_trade' THEN
        IF v_trade_count >= 1 THEN
          INSERT INTO user_achievement_badges (user_id, badge_id)
          VALUES (p_user_id, v_badge.id)
          ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;
      
      WHEN 'trade_count' THEN
        IF v_trade_count >= (v_badge.requirement_value->>'count')::INTEGER THEN
          INSERT INTO user_achievement_badges (user_id, badge_id)
          VALUES (p_user_id, v_badge.id)
          ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;
      
      WHEN 'green_day' THEN
        IF v_green_days >= (v_badge.requirement_value->>'days')::INTEGER THEN
          INSERT INTO user_achievement_badges (user_id, badge_id)
          VALUES (p_user_id, v_badge.id)
          ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;
      
      WHEN 'quiz_passed' THEN
        IF v_quiz_passed_count >= (v_badge.requirement_value->>'count')::INTEGER THEN
          INSERT INTO user_achievement_badges (user_id, badge_id)
          VALUES (p_user_id, v_badge.id)
          ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;
      
      WHEN 'login_streak' THEN
        IF EXISTS (
          SELECT 1 FROM user_login_streaks
          WHERE user_id = p_user_id
          AND current_streak >= (v_badge.requirement_value->>'days')::INTEGER
        ) THEN
          INSERT INTO user_achievement_badges (user_id, badge_id)
          VALUES (p_user_id, v_badge.id)
          ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;
    END CASE;
  END LOOP;
END;
$$;

-- Function to update login streak
CREATE OR REPLACE FUNCTION public.update_login_streak(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_last_login_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_total_logins INTEGER;
BEGIN
  -- Get existing streak data
  SELECT last_login_date, current_streak, longest_streak, total_logins
  INTO v_last_login_date, v_current_streak, v_longest_streak, v_total_logins
  FROM user_login_streaks
  WHERE user_id = p_user_id;
  
  -- If no record exists, create one
  IF v_last_login_date IS NULL THEN
    INSERT INTO user_login_streaks (user_id, current_streak, longest_streak, last_login_date, total_logins)
    VALUES (p_user_id, 1, 1, CURRENT_DATE, 1);
    
    -- Award first login badge
    PERFORM check_and_award_achievement_badges(p_user_id);
    RETURN;
  END IF;
  
  -- If already logged in today, do nothing
  IF v_last_login_date = CURRENT_DATE THEN
    RETURN;
  END IF;
  
  -- If logged in yesterday, increment streak
  IF v_last_login_date = CURRENT_DATE - 1 THEN
    v_current_streak := v_current_streak + 1;
    v_longest_streak := GREATEST(v_longest_streak, v_current_streak);
  -- Otherwise, reset streak
  ELSIF v_last_login_date < CURRENT_DATE - 1 THEN
    v_current_streak := 1;
  END IF;
  
  -- Update the record
  UPDATE user_login_streaks
  SET 
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_login_date = CURRENT_DATE,
    total_logins = v_total_logins + 1,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Check for streak badges
  PERFORM check_and_award_achievement_badges(p_user_id);
END;
$$;

-- Trigger to award badges when tasks are completed
CREATE OR REPLACE FUNCTION trigger_award_badges_on_task_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM check_and_award_achievement_badges(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER award_badges_after_task_completion
AFTER INSERT OR UPDATE ON task_responses
FOR EACH ROW
EXECUTE FUNCTION trigger_award_badges_on_task_complete();

-- Trigger to award badges when trades are logged
CREATE OR REPLACE FUNCTION trigger_award_badges_on_trade_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM check_and_award_achievement_badges(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER award_badges_after_trade_log
AFTER INSERT ON trade_records
FOR EACH ROW
EXECUTE FUNCTION trigger_award_badges_on_trade_log();

-- Trigger to award badges when milestones are completed
CREATE OR REPLACE FUNCTION trigger_award_badges_on_milestone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    PERFORM check_and_award_achievement_badges(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER award_badges_after_milestone_complete
AFTER UPDATE ON user_milestones
FOR EACH ROW
EXECUTE FUNCTION trigger_award_badges_on_milestone();

-- Trigger to award badges when quizzes are passed
CREATE OR REPLACE FUNCTION trigger_award_badges_on_quiz()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.passed = true THEN
    PERFORM check_and_award_achievement_badges(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER award_badges_after_quiz_pass
AFTER INSERT ON quiz_submissions
FOR EACH ROW
EXECUTE FUNCTION trigger_award_badges_on_quiz();
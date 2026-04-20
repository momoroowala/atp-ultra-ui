-- Create habit tracker system with analytics and gamification

-- 1. Create habit_templates table
CREATE TABLE IF NOT EXISTS public.habit_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  icon_name TEXT DEFAULT 'CheckCircle',
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create user_habits table
CREATE TABLE IF NOT EXISTS public.user_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  template_id UUID REFERENCES public.habit_templates(id) ON DELETE SET NULL,
  icon_name TEXT DEFAULT 'CheckCircle',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_active_habit_per_user UNIQUE (user_id, habit_name) 
);

-- 3. Create habit_completions table
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_habit_id UUID NOT NULL REFERENCES public.user_habits(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_habit_completion_per_day UNIQUE (user_id, user_habit_id, completion_date)
);

-- 4. Create habit_streaks table
CREATE TABLE IF NOT EXISTS public.habit_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_habit_id UUID NOT NULL REFERENCES public.user_habits(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completion_date DATE,
  total_completions INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_streak_per_habit UNIQUE (user_id, user_habit_id)
);

-- 5. Create habit_badges table
CREATE TABLE IF NOT EXISTS public.habit_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_key TEXT UNIQUE NOT NULL,
  badge_name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT DEFAULT 'Award',
  tier TEXT,
  requirement_type TEXT,
  requirement_value INTEGER,
  points_value INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create user_habit_badges table
CREATE TABLE IF NOT EXISTS public.user_habit_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.habit_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date ON public.habit_completions(user_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_habit_date ON public.habit_completions(user_id, user_habit_id, completion_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_habits_user_active ON public.user_habits(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_habits_order ON public.user_habits(user_id, order_index);
CREATE INDEX IF NOT EXISTS idx_habit_streaks_user ON public.habit_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_habit_badges_user ON public.user_habit_badges(user_id, earned_at DESC);

-- Enable RLS
ALTER TABLE public.habit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_habit_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for habit_templates
CREATE POLICY "Anyone can view habit templates"
  ON public.habit_templates FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_habits
CREATE POLICY "Users can view their own habits"
  ON public.user_habits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits"
  ON public.user_habits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits"
  ON public.user_habits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their custom habits"
  ON public.user_habits FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_custom = true);

-- RLS Policies for habit_completions
CREATE POLICY "Users can view their own completions"
  ON public.habit_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions"
  ON public.habit_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own completions"
  ON public.habit_completions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for habit_streaks
CREATE POLICY "Users can view their own streaks"
  ON public.habit_streaks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for habit_badges
CREATE POLICY "Anyone can view badges"
  ON public.habit_badges FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_habit_badges
CREATE POLICY "Users can view their own earned badges"
  ON public.user_habit_badges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to seed user habits from templates
CREATE OR REPLACE FUNCTION public.seed_user_habits(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_habits (user_id, habit_name, description, order_index, is_custom, template_id, icon_name)
  SELECT 
    p_user_id,
    name,
    description,
    order_index,
    false,
    id,
    icon_name
  FROM public.habit_templates
  WHERE is_active = true
  ON CONFLICT (user_id, habit_name) DO NOTHING;

  -- Initialize streaks for new habits
  INSERT INTO public.habit_streaks (user_id, user_habit_id, current_streak, longest_streak, total_completions)
  SELECT 
    p_user_id,
    uh.id,
    0,
    0,
    0
  FROM public.user_habits uh
  WHERE uh.user_id = p_user_id
  ON CONFLICT (user_id, user_habit_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to assign daily habits
CREATE OR REPLACE FUNCTION public.assign_daily_habits(
  p_user_id UUID,
  p_target_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO public.habit_completions (user_id, user_habit_id, completion_date, completed)
  SELECT 
    p_user_id,
    id,
    p_target_date,
    false
  FROM public.user_habits
  WHERE user_id = p_user_id AND is_active = true
  ON CONFLICT (user_id, user_habit_id, completion_date) DO NOTHING;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update habit streak
CREATE OR REPLACE FUNCTION public.update_habit_streak(
  p_user_id UUID,
  p_user_habit_id UUID
)
RETURNS void AS $$
DECLARE
  v_current_streak INTEGER := 0;
  v_longest_streak INTEGER;
  v_total_completions INTEGER;
  v_last_date DATE;
  v_check_date DATE := CURRENT_DATE;
  v_completed BOOLEAN;
BEGIN
  -- Count consecutive completed days from today backwards
  LOOP
    SELECT completed INTO v_completed
    FROM public.habit_completions
    WHERE user_id = p_user_id 
      AND user_habit_id = p_user_habit_id 
      AND completion_date = v_check_date;
    
    -- If no record or not completed, break the streak
    IF NOT FOUND OR NOT v_completed THEN
      EXIT;
    END IF;
    
    v_current_streak := v_current_streak + 1;
    v_check_date := v_check_date - 1;
  END LOOP;

  -- Get total completions
  SELECT COUNT(*) INTO v_total_completions
  FROM public.habit_completions
  WHERE user_id = p_user_id 
    AND user_habit_id = p_user_habit_id 
    AND completed = true;

  -- Get last completion date
  SELECT MAX(completion_date) INTO v_last_date
  FROM public.habit_completions
  WHERE user_id = p_user_id 
    AND user_habit_id = p_user_habit_id 
    AND completed = true;

  -- Get current longest streak
  SELECT longest_streak INTO v_longest_streak
  FROM public.habit_streaks
  WHERE user_id = p_user_id AND user_habit_id = p_user_habit_id;

  -- Update longest if current is higher
  IF v_current_streak > COALESCE(v_longest_streak, 0) THEN
    v_longest_streak := v_current_streak;
  END IF;

  -- Upsert streak record
  INSERT INTO public.habit_streaks (user_id, user_habit_id, current_streak, longest_streak, total_completions, last_completion_date)
  VALUES (p_user_id, p_user_habit_id, v_current_streak, v_longest_streak, v_total_completions, v_last_date)
  ON CONFLICT (user_id, user_habit_id) 
  DO UPDATE SET 
    current_streak = v_current_streak,
    longest_streak = GREATEST(EXCLUDED.longest_streak, v_longest_streak),
    total_completions = v_total_completions,
    last_completion_date = v_last_date,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to toggle habit completion
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
    'completed_at', CASE WHEN v_new_completed THEN now() ELSE NULL END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_badge RECORD;
  v_max_streak INTEGER;
  v_total_completions INTEGER;
  v_perfect_days INTEGER;
BEGIN
  -- Get user's best stats
  SELECT 
    MAX(current_streak) as max_current_streak,
    SUM(total_completions) as total_comps
  INTO v_max_streak, v_total_completions
  FROM public.habit_streaks
  WHERE user_id = p_user_id;

  -- Count perfect days (all habits completed)
  SELECT COUNT(DISTINCT completion_date) INTO v_perfect_days
  FROM public.habit_completions hc
  WHERE hc.user_id = p_user_id 
    AND hc.completed = true
    AND NOT EXISTS (
      SELECT 1 FROM public.habit_completions hc2
      WHERE hc2.user_id = p_user_id 
        AND hc2.completion_date = hc.completion_date
        AND hc2.completed = false
    );

  -- Check streak badges
  FOR v_badge IN 
    SELECT * FROM public.habit_badges 
    WHERE requirement_type = 'streak' 
      AND requirement_value <= COALESCE(v_max_streak, 0)
  LOOP
    INSERT INTO public.user_habit_badges (user_id, badge_id)
    VALUES (p_user_id, v_badge.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;

  -- Check total completion badges
  FOR v_badge IN 
    SELECT * FROM public.habit_badges 
    WHERE requirement_type = 'total_completions' 
      AND requirement_value <= COALESCE(v_total_completions, 0)
  LOOP
    INSERT INTO public.user_habit_badges (user_id, badge_id)
    VALUES (p_user_id, v_badge.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;

  -- Check perfect week/month badges
  FOR v_badge IN 
    SELECT * FROM public.habit_badges 
    WHERE requirement_type = 'perfect_days' 
      AND requirement_value <= COALESCE(v_perfect_days, 0)
  LOOP
    INSERT INTO public.user_habit_badges (user_id, badge_id)
    VALUES (p_user_id, v_badge.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get today's habits
CREATE OR REPLACE FUNCTION public.get_today_habits(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_habit_id UUID,
  habit_name TEXT,
  icon_name TEXT,
  completed BOOLEAN,
  completed_at TIMESTAMPTZ,
  current_streak INTEGER,
  notes TEXT
) AS $$
BEGIN
  -- Ensure today's records exist
  PERFORM public.assign_daily_habits(p_user_id, CURRENT_DATE);

  RETURN QUERY
  SELECT 
    hc.id,
    hc.user_habit_id,
    uh.habit_name,
    uh.icon_name,
    hc.completed,
    hc.completed_at,
    COALESCE(hs.current_streak, 0) as current_streak,
    hc.notes
  FROM public.habit_completions hc
  JOIN public.user_habits uh ON hc.user_habit_id = uh.id
  LEFT JOIN public.habit_streaks hs ON hs.user_id = hc.user_id AND hs.user_habit_id = hc.user_habit_id
  WHERE hc.user_id = p_user_id 
    AND hc.completion_date = CURRENT_DATE
    AND uh.is_active = true
  ORDER BY uh.order_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get habit analytics
CREATE OR REPLACE FUNCTION public.get_habit_analytics(
  p_user_id UUID,
  p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  completion_date DATE,
  total_habits INTEGER,
  completed_count INTEGER,
  completion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hc.completion_date,
    COUNT(*)::INTEGER as total_habits,
    SUM(CASE WHEN hc.completed THEN 1 ELSE 0 END)::INTEGER as completed_count,
    ROUND(
      (SUM(CASE WHEN hc.completed THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC) * 100,
      2
    ) as completion_rate
  FROM public.habit_completions hc
  WHERE hc.user_id = p_user_id
    AND hc.completion_date >= CURRENT_DATE - p_days_back
  GROUP BY hc.completion_date
  ORDER BY hc.completion_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get user habit stats
CREATE OR REPLACE FUNCTION public.get_user_habit_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total_habits', (SELECT COUNT(*) FROM public.user_habits WHERE user_id = p_user_id AND is_active = true),
    'active_streaks', (SELECT COUNT(*) FROM public.habit_streaks WHERE user_id = p_user_id AND current_streak > 0),
    'longest_streak', (SELECT COALESCE(MAX(longest_streak), 0) FROM public.habit_streaks WHERE user_id = p_user_id),
    'total_completions', (SELECT COALESCE(SUM(total_completions), 0) FROM public.habit_streaks WHERE user_id = p_user_id),
    'badges_earned', (SELECT COUNT(*) FROM public.user_habit_badges WHERE user_id = p_user_id)
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers
CREATE TRIGGER update_habit_templates_updated_at
  BEFORE UPDATE ON public.habit_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_habits_updated_at
  BEFORE UPDATE ON public.user_habits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_habit_completions_updated_at
  BEFORE UPDATE ON public.habit_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_habit_streaks_updated_at
  BEFORE UPDATE ON public.habit_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed habit templates
INSERT INTO public.habit_templates (name, description, order_index, icon_name, category) VALUES
  ('Trade/Study', 'Complete your daily trading or study session', 1, 'TrendingUp', 'trading'),
  ('Gratitude', 'Practice daily gratitude', 2, 'Heart', 'mindfulness'),
  ('Gym', 'Complete your workout', 3, 'Dumbbell', 'health'),
  ('Followed Trading Plan', 'Stick to your trading plan', 4, 'ClipboardCheck', 'trading'),
  ('Meditate', 'Daily meditation practice', 5, 'Sparkles', 'mindfulness'),
  ('Afternoon Walk', 'Take an afternoon walk', 6, 'Sun', 'health'),
  ('Wake Up 5AM', 'Wake up at 5 AM', 7, 'Sunrise', 'health')
ON CONFLICT DO NOTHING;

-- Seed badges
INSERT INTO public.habit_badges (badge_key, badge_name, description, icon_name, tier, requirement_type, requirement_value, points_value) VALUES
  ('first_week', 'First Week', 'Complete a 7-day streak', 'Flame', 'bronze', 'streak', 7, 50),
  ('two_weeks', 'Two Weeks Strong', 'Complete a 14-day streak', 'Flame', 'silver', 'streak', 14, 100),
  ('monthly_master', 'Monthly Master', 'Complete a 30-day streak', 'Flame', 'gold', 'streak', 30, 250),
  ('quarter_champion', 'Quarter Champion', 'Complete a 90-day streak', 'Flame', 'platinum', 'streak', 90, 500),
  ('century_club', 'Century Club', 'Complete 100 total habits', 'CheckCircle', 'bronze', 'total_completions', 100, 50),
  ('500_club', '500 Club', 'Complete 500 total habits', 'CheckCircle', 'silver', 'total_completions', 500, 150),
  ('1000_club', '1000 Club', 'Complete 1000 total habits', 'CheckCircle', 'gold', 'total_completions', 1000, 300),
  ('perfect_week', 'Perfect Week', 'Complete all habits for 7 days', 'Star', 'bronze', 'perfect_days', 7, 75),
  ('perfect_month', 'Perfect Month', 'Complete all habits for 30 days', 'Star', 'gold', 'perfect_days', 30, 300)
ON CONFLICT DO NOTHING;

-- Seed habits for existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    PERFORM public.seed_user_habits(user_record.id);
  END LOOP;
END $$;
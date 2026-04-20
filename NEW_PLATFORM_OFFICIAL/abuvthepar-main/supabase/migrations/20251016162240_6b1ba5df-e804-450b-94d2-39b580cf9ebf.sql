-- 1) Add indexes for faster habit queries
CREATE INDEX IF NOT EXISTS idx_user_habit_completions_user_date 
  ON user_habit_completions(user_id, assigned_date);

CREATE INDEX IF NOT EXISTS idx_user_habit_completions_user_completed_date 
  ON user_habit_completions(user_id, completed, assigned_date);

CREATE INDEX IF NOT EXISTS idx_user_custom_habits_user_active 
  ON user_custom_habits(user_id, is_active);

-- 2) Create view for server-side joining of habit task info
CREATE OR REPLACE VIEW user_habit_items_v AS
SELECT
  uhc.id,
  uhc.user_id,
  uhc.habit_task_id,
  uhc.assigned_date,
  uhc.completed,
  uhc.completed_at,
  COALESCE(uch.task_name, htt.task_name) AS task_name,
  COALESCE(uch.order_index, htt.order_index) AS order_index
FROM user_habit_completions uhc
LEFT JOIN user_custom_habits uch ON uch.id = uhc.habit_task_id AND uch.user_id = uhc.user_id
LEFT JOIN habit_tracker_tasks htt ON htt.id = uhc.habit_task_id;

-- 3) Fast RPC to assign and get today's habits with task info
CREATE OR REPLACE FUNCTION assign_and_get_daily_habits(_user_id uuid, _target_date date)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  habit_task_id uuid,
  assigned_date date,
  completed boolean,
  completed_at timestamp with time zone,
  task_name text,
  order_index integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check
  IF _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Ensure user has custom habits (seed if first time)
  IF NOT EXISTS (
    SELECT 1 FROM user_custom_habits 
    WHERE user_custom_habits.user_id = _user_id AND is_active = true
  ) THEN
    PERFORM seed_user_default_habits(_user_id);
  END IF;

  -- Insert habits for target date from user's custom habits
  INSERT INTO user_habit_completions (user_id, habit_task_id, assigned_date)
  SELECT _user_id, uch.id, _target_date
  FROM user_custom_habits uch
  WHERE uch.user_id = _user_id AND uch.is_active = true
  ON CONFLICT (user_id, habit_task_id, assigned_date) DO NOTHING;

  -- Return all habits for that date with task info
  RETURN QUERY
  SELECT v.* 
  FROM user_habit_items_v v
  WHERE v.user_id = _user_id AND v.assigned_date = _target_date
  ORDER BY v.order_index;
END;
$$;

-- 4) Fast RPC to get overdue habits with task info
CREATE OR REPLACE FUNCTION get_overdue_habits_with_tasks(_user_id uuid, _today date)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  habit_task_id uuid,
  assigned_date date,
  completed boolean,
  completed_at timestamp with time zone,
  task_name text,
  order_index integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check
  IF _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT v.*
  FROM user_habit_items_v v
  WHERE v.user_id = _user_id 
    AND v.assigned_date < _today 
    AND v.completed = false
  ORDER BY v.assigned_date DESC, v.order_index ASC;
END;
$$;

-- 5) Fast RPC for habit completion summary (for streaks)
CREATE OR REPLACE FUNCTION get_habit_completion_summary(_user_id uuid)
RETURNS TABLE(
  assigned_date date,
  completed_count bigint,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check
  IF _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    uhc.assigned_date,
    SUM(CASE WHEN uhc.completed THEN 1 ELSE 0 END) AS completed_count,
    COUNT(*) AS total_count
  FROM user_habit_completions uhc
  WHERE uhc.user_id = _user_id
  GROUP BY uhc.assigned_date
  ORDER BY uhc.assigned_date DESC;
END;
$$;

-- 6) Add trigger to seed default habits when new user profile is created
CREATE OR REPLACE FUNCTION seed_habits_on_profile_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Seed default habits for the new user
  PERFORM seed_user_default_habits(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_seed_habits_on_profile_creation ON user_profiles;

CREATE TRIGGER trigger_seed_habits_on_profile_creation
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION seed_habits_on_profile_creation();
-- Create user_custom_habits table
CREATE TABLE user_custom_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_task UNIQUE(user_id, task_name)
);

-- Enable RLS
ALTER TABLE user_custom_habits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own custom habits"
  ON user_custom_habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom habits"
  ON user_custom_habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom habits"
  ON user_custom_habits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom habits"
  ON user_custom_habits FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_custom_habits_updated_at
  BEFORE UPDATE ON user_custom_habits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to seed default habits for a user
CREATE OR REPLACE FUNCTION seed_user_default_habits(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_custom_habits (user_id, task_name, description, order_index)
  SELECT _user_id, task_name, description, order_index
  FROM habit_tracker_tasks
  WHERE is_active = true
  ON CONFLICT (user_id, task_name) DO NOTHING;
END;
$$;

-- Update assign_daily_habits to use user custom habits
CREATE OR REPLACE FUNCTION assign_daily_habits(_user_id UUID, _target_date DATE)
RETURNS SETOF user_habit_completions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure user has custom habits (seed if first time)
  IF NOT EXISTS (
    SELECT 1 FROM user_custom_habits 
    WHERE user_id = _user_id AND is_active = true
  ) THEN
    PERFORM seed_user_default_habits(_user_id);
  END IF;

  -- Insert habits for target date from user's custom habits
  INSERT INTO user_habit_completions (user_id, habit_task_id, assigned_date)
  SELECT _user_id, id, _target_date
  FROM user_custom_habits
  WHERE user_id = _user_id AND is_active = true
  ON CONFLICT (user_id, habit_task_id, assigned_date) DO NOTHING;
  
  -- Return all habits for that date
  RETURN QUERY
  SELECT uhc.* FROM user_habit_completions uhc
  WHERE uhc.user_id = _user_id AND uhc.assigned_date = _target_date
  ORDER BY (
    SELECT order_index 
    FROM user_custom_habits 
    WHERE id = uhc.habit_task_id
  );
END;
$$;

-- Migrate existing users with default habits
INSERT INTO user_custom_habits (user_id, task_name, description, order_index)
SELECT up.id, htt.task_name, htt.description, htt.order_index
FROM user_profiles up
CROSS JOIN habit_tracker_tasks htt
WHERE htt.is_active = true
ON CONFLICT (user_id, task_name) DO NOTHING;
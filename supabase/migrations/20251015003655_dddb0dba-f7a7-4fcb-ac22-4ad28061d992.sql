-- Create habit_tracker_tasks table (master list of habits)
CREATE TABLE public.habit_tracker_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_habit_completions table (user's daily task assignments)
CREATE TABLE public.user_habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  habit_task_id UUID NOT NULL REFERENCES public.habit_tracker_tasks(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, habit_task_id, assigned_date)
);

-- Enable RLS on both tables
ALTER TABLE public.habit_tracker_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_habit_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for habit_tracker_tasks
CREATE POLICY "All authenticated users can view active habits"
ON public.habit_tracker_tasks
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage habit tasks"
ON public.habit_tracker_tasks
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

-- RLS Policies for user_habit_completions
CREATE POLICY "Users can view own habit completions"
ON public.user_habit_completions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit completions"
ON public.user_habit_completions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit completions"
ON public.user_habit_completions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit completions"
ON public.user_habit_completions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Seed the 7 default habit tasks
INSERT INTO public.habit_tracker_tasks (task_name, order_index) VALUES
  ('Trade/Study', 1),
  ('Gratitude', 2),
  ('Gym', 3),
  ('Followed Trading Plan', 4),
  ('Meditate', 5),
  ('Afternoon Walk', 6),
  ('Wake Up 5AM', 7);

-- Create function to assign daily habits
CREATE OR REPLACE FUNCTION public.assign_daily_habits(_user_id uuid, _target_date date)
RETURNS SETOF user_habit_completions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert habits for target date if they don't exist
  INSERT INTO user_habit_completions (user_id, habit_task_id, assigned_date)
  SELECT _user_id, id, _target_date
  FROM habit_tracker_tasks
  WHERE is_active = true
  ON CONFLICT (user_id, habit_task_id, assigned_date) DO NOTHING;
  
  -- Return all habits for that date
  RETURN QUERY
  SELECT * FROM user_habit_completions
  WHERE user_id = _user_id AND assigned_date = _target_date
  ORDER BY (
    SELECT order_index 
    FROM habit_tracker_tasks 
    WHERE id = habit_task_id
  );
END;
$$;

-- Add updated_at trigger for habit_tracker_tasks
CREATE TRIGGER update_habit_tracker_tasks_updated_at
BEFORE UPDATE ON public.habit_tracker_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for user_habit_completions
CREATE TRIGGER update_user_habit_completions_updated_at
BEFORE UPDATE ON public.user_habit_completions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
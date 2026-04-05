
-- Create sprint_task_completions table
CREATE TABLE public.sprint_task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_day integer NOT NULL CHECK (task_day >= 1 AND task_day <= 30),
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, task_day)
);

-- Enable RLS
ALTER TABLE public.sprint_task_completions ENABLE ROW LEVEL SECURITY;

-- Users can SELECT their own rows
CREATE POLICY "Users can select own sprint completions"
  ON public.sprint_task_completions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can INSERT their own rows
CREATE POLICY "Users can insert own sprint completions"
  ON public.sprint_task_completions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can UPDATE their own rows
CREATE POLICY "Users can update own sprint completions"
  ON public.sprint_task_completions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

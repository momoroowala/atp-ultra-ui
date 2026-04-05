ALTER TABLE public.sprint_task_completions
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'not_started';

UPDATE public.sprint_task_completions
  SET status = CASE WHEN completed THEN 'completed' ELSE 'not_started' END
  WHERE status IS NULL OR status = 'not_started';
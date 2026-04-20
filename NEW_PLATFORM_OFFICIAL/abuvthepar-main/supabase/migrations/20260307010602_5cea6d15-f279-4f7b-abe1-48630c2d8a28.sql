ALTER TABLE public.sprint_tasks
  ADD COLUMN IF NOT EXISTS success_metrics text,
  ADD COLUMN IF NOT EXISTS common_mistakes text,
  ADD COLUMN IF NOT EXISTS templates jsonb;

-- Drop the partial unique index that prevents upsert from working
DROP INDEX IF EXISTS sprint_task_completions_user_task_unique;

-- Make task_id NOT NULL (all existing rows should already have task_id populated)
ALTER TABLE public.sprint_task_completions 
  ALTER COLUMN task_id SET NOT NULL;

-- Add a proper unique constraint (not a partial index)
ALTER TABLE public.sprint_task_completions 
  ADD CONSTRAINT sprint_task_completions_user_id_task_id_key UNIQUE (user_id, task_id);

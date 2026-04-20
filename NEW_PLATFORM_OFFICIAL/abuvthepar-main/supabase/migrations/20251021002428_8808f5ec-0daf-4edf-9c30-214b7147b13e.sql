-- Drop the tasks_task_type_check constraint to allow flexible task types
-- This allows tasks to use section-based content instead of predefined types
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_task_type_check;
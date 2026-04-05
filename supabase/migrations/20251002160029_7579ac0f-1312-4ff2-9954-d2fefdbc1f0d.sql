-- Add visible_tiers column to phases table
ALTER TABLE phases ADD COLUMN IF NOT EXISTS visible_tiers text[] DEFAULT ARRAY['all'];

-- Add visible_tiers and unlock fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS visible_tiers text[] DEFAULT ARRAY['all'];
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS unlock_type text DEFAULT 'previous_task';

-- Update unlock_type constraints
ALTER TABLE phases 
  DROP CONSTRAINT IF EXISTS phases_unlock_type_check,
  ADD CONSTRAINT phases_unlock_type_check 
  CHECK (unlock_type IN ('previous_task', 'time', 'completion'));

ALTER TABLE tasks
  DROP CONSTRAINT IF EXISTS tasks_unlock_type_check,
  ADD CONSTRAINT tasks_unlock_type_check
  CHECK (unlock_type IN ('previous_task', 'time', 'completion'));
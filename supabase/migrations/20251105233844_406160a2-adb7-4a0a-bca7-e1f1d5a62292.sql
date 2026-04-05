-- Add composite index to speed up task queries by phase_id
CREATE INDEX IF NOT EXISTS idx_tasks_phase_active 
ON tasks(phase_id, is_active) 
WHERE is_active = true;

-- Add index for task_responses lookups by user
CREATE INDEX IF NOT EXISTS idx_task_responses_user_task 
ON task_responses(user_id, task_id);

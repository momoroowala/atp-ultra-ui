-- Add indexes to optimize phases and tasks queries
CREATE INDEX IF NOT EXISTS idx_phases_course_phase_order ON phases (course_id, phase_order);
CREATE INDEX IF NOT EXISTS idx_tasks_phase_task_order ON tasks (phase_id, task_order);
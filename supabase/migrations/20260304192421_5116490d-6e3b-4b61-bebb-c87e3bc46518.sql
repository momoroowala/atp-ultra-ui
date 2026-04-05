
-- Clean orphaned submissions
DELETE FROM user_task_submissions
WHERE task_id NOT IN (SELECT id FROM tasks);

-- Add FK with cascade
ALTER TABLE user_task_submissions
ADD CONSTRAINT user_task_submissions_task_id_fkey
FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

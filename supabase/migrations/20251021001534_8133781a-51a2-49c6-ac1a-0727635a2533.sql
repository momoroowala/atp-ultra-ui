-- Make task_type nullable and set default value
ALTER TABLE tasks 
ALTER COLUMN task_type DROP NOT NULL,
ALTER COLUMN task_type SET DEFAULT 'custom';
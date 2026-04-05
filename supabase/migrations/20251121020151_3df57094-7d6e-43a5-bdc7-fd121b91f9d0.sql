-- Drop the single row constraint
DROP INDEX IF EXISTS single_row_idx;

-- Add unique constraint on version column to prevent duplicate versions
ALTER TABLE app_version 
ADD CONSTRAINT app_version_version_key UNIQUE (version);
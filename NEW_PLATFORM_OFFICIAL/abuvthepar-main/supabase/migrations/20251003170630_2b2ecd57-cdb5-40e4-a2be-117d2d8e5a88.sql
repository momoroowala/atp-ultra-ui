-- Add new status values to task_status enum for comprehensive task workflow
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'pending_review';
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'changes_required';
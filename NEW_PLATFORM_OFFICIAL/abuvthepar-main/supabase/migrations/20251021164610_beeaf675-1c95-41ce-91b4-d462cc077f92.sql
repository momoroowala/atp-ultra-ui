-- Add started_at column to task_responses table
ALTER TABLE public.task_responses
ADD COLUMN started_at timestamp with time zone;

-- Add index for better query performance
CREATE INDEX idx_task_responses_started_at ON public.task_responses(started_at);

-- Update existing in_progress tasks to have a started_at timestamp
UPDATE public.task_responses
SET started_at = created_at
WHERE status = 'in_progress' AND started_at IS NULL;
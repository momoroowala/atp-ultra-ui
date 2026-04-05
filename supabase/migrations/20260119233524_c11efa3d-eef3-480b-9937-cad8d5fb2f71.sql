-- Mark old orphaned pending records as failed
-- These are records where the generation failed before a task_id was received
UPDATE ugc_video_generations 
SET status = 'failed', 
    error_message = 'Generation failed - no task received'
WHERE status = 'pending' 
  AND task_id IS NULL 
  AND created_at < NOW() - INTERVAL '1 hour';
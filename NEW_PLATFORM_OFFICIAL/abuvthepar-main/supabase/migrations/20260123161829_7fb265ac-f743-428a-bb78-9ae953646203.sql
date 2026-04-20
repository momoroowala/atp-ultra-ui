-- Add retry_count and credit_consumed columns to ugc_video_generations
ALTER TABLE public.ugc_video_generations 
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credit_consumed BOOLEAN DEFAULT false;
-- Add results_narrative column to daily_reviews table for narrative description of daily results
ALTER TABLE daily_reviews 
ADD COLUMN results_narrative TEXT;

COMMENT ON COLUMN daily_reviews.results_narrative IS 'Narrative description of the day''s trading results including profits, trades taken, and whether gains were round-tripped';
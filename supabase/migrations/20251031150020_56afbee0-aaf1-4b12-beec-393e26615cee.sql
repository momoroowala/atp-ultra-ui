-- Add series_id to link recurring calls together
ALTER TABLE calendar_calls 
ADD COLUMN series_id uuid;

-- Create index for better query performance on series_id
CREATE INDEX idx_calendar_calls_series_id ON calendar_calls(series_id);

-- Add comment for documentation
COMMENT ON COLUMN calendar_calls.series_id IS 'Links all occurrences of the same recurring series. NULL for single (non-recurring) calls.';
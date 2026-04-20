-- Backfill series_id for existing recurring calendar calls
-- Group calls by common attributes and assign them a shared series_id

WITH recurring_groups AS (
  SELECT 
    created_by, 
    title, 
    call_time, 
    timezone, 
    call_link,
    gen_random_uuid() AS new_series_id,
    COUNT(*) as occurrence_count
  FROM calendar_calls
  WHERE series_id IS NULL
    AND is_active = true
  GROUP BY created_by, title, call_time, timezone, call_link
  HAVING COUNT(*) > 1
)
UPDATE calendar_calls c
SET series_id = g.new_series_id
FROM recurring_groups g
WHERE c.series_id IS NULL
  AND c.created_by = g.created_by
  AND c.title = g.title
  AND c.call_time = g.call_time
  AND c.timezone = g.timezone
  AND c.call_link = g.call_link;
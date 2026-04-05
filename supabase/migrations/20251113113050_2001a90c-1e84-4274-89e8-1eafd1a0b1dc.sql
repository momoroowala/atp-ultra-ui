-- Add timezone columns to trade_records
ALTER TABLE trade_records 
ADD COLUMN IF NOT EXISTS created_timezone text,
ADD COLUMN IF NOT EXISTS reviewed_timezone text;

-- Backfill existing trade creation timezones
UPDATE trade_records 
SET created_timezone = 'America/New_York' 
WHERE created_timezone IS NULL;

-- Backfill existing review timezones
UPDATE trade_records 
SET reviewed_timezone = 'America/New_York' 
WHERE reviewed_at IS NOT NULL AND reviewed_timezone IS NULL;
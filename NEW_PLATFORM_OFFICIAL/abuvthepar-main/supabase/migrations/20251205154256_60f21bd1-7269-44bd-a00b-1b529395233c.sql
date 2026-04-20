-- Convert emotions column from text to text[] for multi-select support
-- Migrate existing single-value data to array format
ALTER TABLE trade_records 
  ALTER COLUMN emotions TYPE text[] 
  USING CASE 
    WHEN emotions IS NOT NULL THEN ARRAY[emotions] 
    ELSE NULL 
  END;
-- Add is_archived column to trade_records for user archiving
ALTER TABLE public.trade_records 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_trade_records_archived 
ON public.trade_records(user_id, is_archived, review_status);
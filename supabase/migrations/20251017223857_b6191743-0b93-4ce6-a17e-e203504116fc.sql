-- Ensure full row data for realtime updates
ALTER TABLE public.trade_records REPLICA IDENTITY FULL;

-- Add trade_records to the realtime publication (idempotent; will no-op if already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_records;
-- Enable real-time updates for trade_records table
ALTER TABLE trade_records REPLICA IDENTITY FULL;
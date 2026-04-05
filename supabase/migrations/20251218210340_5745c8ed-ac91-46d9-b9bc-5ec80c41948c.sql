-- Enable REPLICA IDENTITY FULL for complete row data in realtime updates
ALTER TABLE community_messages REPLICA IDENTITY FULL;
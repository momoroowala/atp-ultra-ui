-- Enable REPLICA IDENTITY FULL for realtime to work properly
ALTER TABLE public.community_messages REPLICA IDENTITY FULL;
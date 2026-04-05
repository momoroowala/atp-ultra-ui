ALTER TABLE community_messages 
  ADD COLUMN shared_from_thread_id UUID REFERENCES community_messages(id) ON DELETE SET NULL;
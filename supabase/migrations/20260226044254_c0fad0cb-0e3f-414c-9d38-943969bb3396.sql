ALTER TABLE community_messages
  ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinned_by uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pinned_at timestamptz DEFAULT NULL;
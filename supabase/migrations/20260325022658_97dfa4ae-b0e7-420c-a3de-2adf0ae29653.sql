CREATE TABLE scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  channel_id UUID REFERENCES community_channels(id) ON DELETE CASCADE,
  dm_conversation_id UUID REFERENCES community_dm_conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  mentions UUID[] DEFAULT '{}',
  scheduled_at TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'biweekly')),
  recurrence_end_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own scheduled messages"
  ON scheduled_messages FOR ALL TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

CREATE TRIGGER update_scheduled_messages_updated_at
  BEFORE UPDATE ON scheduled_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Create community_channels table for public channels
CREATE TABLE public.community_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_emoji TEXT DEFAULT '💬',
  created_by UUID NOT NULL,
  visible_tier_ids UUID[] DEFAULT ARRAY[]::UUID[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create community_dm_conversations table for DM containers
CREATE TABLE public.community_dm_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

-- Create community_dm_participants table
CREATE TABLE public.community_dm_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.community_dm_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Create community_messages table for all messages
CREATE TABLE public.community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  channel_id UUID REFERENCES public.community_channels(id) ON DELETE CASCADE,
  dm_conversation_id UUID REFERENCES public.community_dm_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  parent_message_id UUID REFERENCES public.community_messages(id) ON DELETE SET NULL,
  attachments JSONB DEFAULT '[]'::JSONB,
  mentions UUID[] DEFAULT ARRAY[]::UUID[],
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT message_destination CHECK (
    (channel_id IS NOT NULL AND dm_conversation_id IS NULL) OR
    (channel_id IS NULL AND dm_conversation_id IS NOT NULL)
  )
);

-- Create community_message_reactions table
CREATE TABLE public.community_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create community_user_channel_settings table for notification preferences
CREATE TABLE public.community_user_channel_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  channel_id UUID NOT NULL REFERENCES public.community_channels(id) ON DELETE CASCADE,
  notification_level TEXT DEFAULT 'all' CHECK (notification_level IN ('all', 'mentions_only', 'muted')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, channel_id)
);

-- Create push_subscriptions table for web push notifications
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Create indexes for performance
CREATE INDEX idx_community_messages_channel ON public.community_messages(channel_id) WHERE channel_id IS NOT NULL;
CREATE INDEX idx_community_messages_dm ON public.community_messages(dm_conversation_id) WHERE dm_conversation_id IS NOT NULL;
CREATE INDEX idx_community_messages_sender ON public.community_messages(sender_id);
CREATE INDEX idx_community_messages_parent ON public.community_messages(parent_message_id) WHERE parent_message_id IS NOT NULL;
CREATE INDEX idx_community_messages_created ON public.community_messages(created_at DESC);
CREATE INDEX idx_community_reactions_message ON public.community_message_reactions(message_id);
CREATE INDEX idx_community_dm_participants_user ON public.community_dm_participants(user_id);
CREATE INDEX idx_community_dm_participants_conv ON public.community_dm_participants(conversation_id);

-- Enable RLS on all tables
ALTER TABLE public.community_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_dm_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_user_channel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_channels
CREATE POLICY "Admins can manage channels"
ON public.community_channels FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can view accessible channels"
ON public.community_channels FOR SELECT
USING (
  is_active = true AND (
    is_admin(auth.uid()) OR
    visible_tier_ids IS NULL OR
    array_length(visible_tier_ids, 1) IS NULL OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.tier_id = ANY(community_channels.visible_tier_ids)
    ) OR
    EXISTS (
      SELECT 1 FROM tiers
      WHERE tiers.tier_key = 'all'
      AND tiers.id = ANY(community_channels.visible_tier_ids)
    )
  )
);

-- RLS Policies for community_dm_conversations
CREATE POLICY "Users can view their DM conversations"
ON public.community_dm_conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_dm_participants
    WHERE community_dm_participants.conversation_id = community_dm_conversations.id
    AND community_dm_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create DM conversations"
ON public.community_dm_conversations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their DM conversations"
ON public.community_dm_conversations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM community_dm_participants
    WHERE community_dm_participants.conversation_id = community_dm_conversations.id
    AND community_dm_participants.user_id = auth.uid()
  )
);

-- RLS Policies for community_dm_participants
CREATE POLICY "Users can view participants in their conversations"
ON public.community_dm_participants FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM community_dm_participants cdp
    WHERE cdp.conversation_id = community_dm_participants.conversation_id
    AND cdp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add participants to conversations"
ON public.community_dm_participants FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own participant record"
ON public.community_dm_participants FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for community_messages
CREATE POLICY "Users can view channel messages they have access to"
ON public.community_messages FOR SELECT
USING (
  (
    channel_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM community_channels
      WHERE community_channels.id = community_messages.channel_id
      AND community_channels.is_active = true
      AND (
        is_admin(auth.uid()) OR
        community_channels.visible_tier_ids IS NULL OR
        array_length(community_channels.visible_tier_ids, 1) IS NULL OR
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.tier_id = ANY(community_channels.visible_tier_ids)
        ) OR
        EXISTS (
          SELECT 1 FROM tiers
          WHERE tiers.tier_key = 'all'
          AND tiers.id = ANY(community_channels.visible_tier_ids)
        )
      )
    )
  ) OR (
    dm_conversation_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM community_dm_participants
      WHERE community_dm_participants.conversation_id = community_messages.dm_conversation_id
      AND community_dm_participants.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can send messages to accessible channels"
ON public.community_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND (
    (
      channel_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM community_channels
        WHERE community_channels.id = channel_id
        AND community_channels.is_active = true
        AND (
          is_admin(auth.uid()) OR
          community_channels.visible_tier_ids IS NULL OR
          array_length(community_channels.visible_tier_ids, 1) IS NULL OR
          EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.tier_id = ANY(community_channels.visible_tier_ids)
          ) OR
          EXISTS (
            SELECT 1 FROM tiers
            WHERE tiers.tier_key = 'all'
            AND tiers.id = ANY(community_channels.visible_tier_ids)
          )
        )
      )
    ) OR (
      dm_conversation_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM community_dm_participants
        WHERE community_dm_participants.conversation_id = dm_conversation_id
        AND community_dm_participants.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can update their own messages"
ON public.community_messages FOR UPDATE
USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
ON public.community_messages FOR DELETE
USING (sender_id = auth.uid());

-- RLS Policies for community_message_reactions
CREATE POLICY "Users can view reactions"
ON public.community_message_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_messages
    WHERE community_messages.id = community_message_reactions.message_id
  )
);

CREATE POLICY "Users can add their own reactions"
ON public.community_message_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
ON public.community_message_reactions FOR DELETE
USING (user_id = auth.uid());

-- RLS Policies for community_user_channel_settings
CREATE POLICY "Users can view their own channel settings"
ON public.community_user_channel_settings FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own channel settings"
ON public.community_user_channel_settings FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS Policies for push_subscriptions
CREATE POLICY "Users can manage their own push subscriptions"
ON public.push_subscriptions FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Enable Realtime for messages and reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_message_reactions;

-- Set REPLICA IDENTITY for realtime
ALTER TABLE public.community_messages REPLICA IDENTITY FULL;
ALTER TABLE public.community_message_reactions REPLICA IDENTITY FULL;

-- Create trigger for updated_at
CREATE TRIGGER update_community_channels_updated_at
BEFORE UPDATE ON public.community_channels
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_community_messages_updated_at
BEFORE UPDATE ON public.community_messages
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_community_dm_conversations_updated_at
BEFORE UPDATE ON public.community_dm_conversations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_community_user_channel_settings_updated_at
BEFORE UPDATE ON public.community_user_channel_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
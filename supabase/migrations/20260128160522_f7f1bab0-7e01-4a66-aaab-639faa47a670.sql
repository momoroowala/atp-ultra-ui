-- Add moderation columns to community_messages
ALTER TABLE community_messages 
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flagged_by UUID,
ADD COLUMN IF NOT EXISTS flag_reason TEXT,
ADD COLUMN IF NOT EXISTS ai_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS reviewed_by UUID,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Add constraint for moderation_status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'community_messages_moderation_status_check'
  ) THEN
    ALTER TABLE community_messages 
    ADD CONSTRAINT community_messages_moderation_status_check 
    CHECK (moderation_status IN ('none', 'pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Create blocked users table
CREATE TABLE IF NOT EXISTS public.community_blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  blocked_by UUID NOT NULL,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMPTZ DEFAULT now(),
  unblocked_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row-Level Security on blocked users table
ALTER TABLE community_blocked_users ENABLE ROW LEVEL SECURITY;

-- Admins can view all blocked users
DROP POLICY IF EXISTS "Admins can view blocked users" ON community_blocked_users;
CREATE POLICY "Admins can view blocked users" 
ON community_blocked_users FOR SELECT 
USING (is_admin(auth.uid()));

-- Admins can insert blocked users
DROP POLICY IF EXISTS "Admins can insert blocked users" ON community_blocked_users;
CREATE POLICY "Admins can insert blocked users" 
ON community_blocked_users FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

-- Admins can update blocked users
DROP POLICY IF EXISTS "Admins can update blocked users" ON community_blocked_users;
CREATE POLICY "Admins can update blocked users" 
ON community_blocked_users FOR UPDATE 
USING (is_admin(auth.uid()));

-- Admins can delete blocked users
DROP POLICY IF EXISTS "Admins can delete blocked users" ON community_blocked_users;
CREATE POLICY "Admins can delete blocked users" 
ON community_blocked_users FOR DELETE 
USING (is_admin(auth.uid()));

-- Users can check if they are blocked
DROP POLICY IF EXISTS "Users can check own block status" ON community_blocked_users;
CREATE POLICY "Users can check own block status" 
ON community_blocked_users FOR SELECT 
USING (auth.uid() = user_id);

-- Update RLS policy for message visibility with moderation
DROP POLICY IF EXISTS "Users can view messages in their channels" ON community_messages;
DROP POLICY IF EXISTS "Users can view messages with moderation" ON community_messages;

CREATE POLICY "Users can view messages with moderation" 
ON community_messages FOR SELECT 
USING (
  -- Admins see everything
  is_admin(auth.uid())
  OR
  -- Users see their own messages (even if hidden)
  sender_id = auth.uid()
  OR
  -- Users see non-hidden messages in channels they have access to
  (
    (is_hidden IS NULL OR is_hidden = false)
    AND (
      -- Channel messages - user has tier access
      (channel_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM community_channels c 
        WHERE c.id = channel_id AND c.is_active = true
      ))
      OR
      -- DM messages - user is participant
      (dm_conversation_id IS NOT NULL AND is_dm_conversation_participant(auth.uid(), dm_conversation_id))
    )
  )
);

-- Function to check if a user is blocked from chat
CREATE OR REPLACE FUNCTION public.is_user_blocked_from_chat(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_blocked_users
    WHERE user_id = p_user_id
      AND is_active = true
  )
$$;
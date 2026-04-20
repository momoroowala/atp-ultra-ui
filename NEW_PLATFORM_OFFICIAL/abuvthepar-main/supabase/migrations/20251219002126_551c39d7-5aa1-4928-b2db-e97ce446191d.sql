-- Allow admins to delete any message (update the existing policy)
DROP POLICY IF EXISTS "Users can delete their own messages" ON community_messages;

CREATE POLICY "Users can delete own messages or admins can delete any" 
ON community_messages 
FOR DELETE 
USING (
  (sender_id = auth.uid()) OR is_admin(auth.uid())
);

-- Allow admins to update any message (for moderation purposes)
DROP POLICY IF EXISTS "Users can update their own messages" ON community_messages;

CREATE POLICY "Users can update own messages or admins can update any" 
ON community_messages 
FOR UPDATE 
USING (
  (sender_id = auth.uid()) OR is_admin(auth.uid())
);

-- Allow admins to view all DM conversations for monitoring
DROP POLICY IF EXISTS "Admins can view all DM conversations" ON community_dm_conversations;

CREATE POLICY "Admins can view all DM conversations" 
ON community_dm_conversations 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Allow admins to view all DM participants for monitoring
DROP POLICY IF EXISTS "Admins can view all DM participants" ON community_dm_participants;

CREATE POLICY "Admins can view all DM participants" 
ON community_dm_participants 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Allow admins to view all DM messages for monitoring
DROP POLICY IF EXISTS "Admins can view all messages" ON community_messages;

CREATE POLICY "Admins can view all messages" 
ON community_messages 
FOR SELECT 
USING (is_admin(auth.uid()));
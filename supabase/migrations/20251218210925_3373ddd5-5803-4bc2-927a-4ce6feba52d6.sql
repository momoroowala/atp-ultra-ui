-- Drop the restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Users can create DM conversations" ON community_dm_conversations;

-- Create a permissive INSERT policy
CREATE POLICY "Users can create DM conversations"
ON community_dm_conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also make sure VIEW and UPDATE are permissive
DROP POLICY IF EXISTS "Users can view their DM conversations" ON community_dm_conversations;
DROP POLICY IF EXISTS "Users can update their DM conversations" ON community_dm_conversations;

CREATE POLICY "Users can view their DM conversations"
ON community_dm_conversations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM community_dm_participants
    WHERE community_dm_participants.conversation_id = community_dm_conversations.id
    AND community_dm_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their DM conversations"
ON community_dm_conversations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM community_dm_participants
    WHERE community_dm_participants.conversation_id = community_dm_conversations.id
    AND community_dm_participants.user_id = auth.uid()
  )
);
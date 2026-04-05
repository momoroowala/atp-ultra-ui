-- Drop the existing restrictive INSERT policy and create a permissive one
DROP POLICY IF EXISTS "Users can create DM conversations" ON community_dm_conversations;

-- Create a permissive INSERT policy for DM conversations
CREATE POLICY "Users can create DM conversations"
ON community_dm_conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
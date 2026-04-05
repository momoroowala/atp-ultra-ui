-- Allow admins to delete DM conversations
CREATE POLICY "Admins can delete DM conversations"
  ON community_dm_conversations FOR DELETE
  USING (is_admin(auth.uid()));

-- Allow admins to delete DM participants
CREATE POLICY "Admins can delete DM participants"
  ON community_dm_participants FOR DELETE
  USING (is_admin(auth.uid()));

-- Allow admins to delete DM read status records
CREATE POLICY "Admins can delete DM read status"
  ON community_dm_read_status FOR DELETE
  USING (is_admin(auth.uid()));
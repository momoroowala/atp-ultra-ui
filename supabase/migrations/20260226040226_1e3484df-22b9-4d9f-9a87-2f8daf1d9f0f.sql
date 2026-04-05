-- Create a reusable is_staff function
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    JOIN public.roles r ON r.id = up.role_id
    WHERE up.id = _user_id
      AND r.role_key IN ('admin', 'mega_admin', 'csm', 'executive')
      AND up.is_active = true
  )
$$;

-- Update DM conversations DELETE policy
DROP POLICY IF EXISTS "Admins can delete DM conversations" ON community_dm_conversations;
CREATE POLICY "Staff can delete DM conversations"
  ON community_dm_conversations FOR DELETE
  USING (is_staff(auth.uid()));

-- Update DM participants DELETE policy
DROP POLICY IF EXISTS "Admins can delete DM participants" ON community_dm_participants;
CREATE POLICY "Staff can delete DM participants"
  ON community_dm_participants FOR DELETE
  USING (is_staff(auth.uid()));

-- Update DM read status DELETE policy
DROP POLICY IF EXISTS "Admins can delete DM read status" ON community_dm_read_status;
CREATE POLICY "Staff can delete DM read status"
  ON community_dm_read_status FOR DELETE
  USING (is_staff(auth.uid()));

-- Update messages DELETE policy to allow staff
DROP POLICY IF EXISTS "Users can delete own messages or admins can delete any" ON community_messages;
CREATE POLICY "Users or staff can delete messages"
  ON community_messages FOR DELETE
  USING (
    (sender_id = auth.uid()) OR is_staff(auth.uid())
  );
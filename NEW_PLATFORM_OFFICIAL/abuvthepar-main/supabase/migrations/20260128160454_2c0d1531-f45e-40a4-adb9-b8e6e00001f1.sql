-- Function to get all admin user IDs
CREATE OR REPLACE FUNCTION public.get_all_admin_ids()
RETURNS UUID[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(ARRAY_AGG(up.id), ARRAY[]::UUID[])
  FROM public.user_profiles up
  JOIN public.roles r ON r.id = up.role_id
  WHERE r.role_key IN ('admin', 'mega_admin')
    AND up.is_active = true
$$;

-- Function to ensure all admins are participants in a DM conversation
CREATE OR REPLACE FUNCTION public.ensure_admins_in_dm(p_conversation_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_ids UUID[];
  admin_id UUID;
BEGIN
  admin_ids := get_all_admin_ids();
  
  IF admin_ids IS NOT NULL THEN
    FOREACH admin_id IN ARRAY admin_ids
    LOOP
      INSERT INTO community_dm_participants (conversation_id, user_id)
      VALUES (p_conversation_id, admin_id)
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END LOOP;
  END IF;
END;
$$;

-- Trigger function to add all admins when a DM conversation is created
CREATE OR REPLACE FUNCTION public.add_admins_to_new_dm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM ensure_admins_in_dm(NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger for auto-adding admins to new DMs
DROP TRIGGER IF EXISTS tr_add_admins_to_dm ON community_dm_conversations;
CREATE TRIGGER tr_add_admins_to_dm
AFTER INSERT ON community_dm_conversations
FOR EACH ROW
EXECUTE FUNCTION add_admins_to_new_dm();

-- Migration: Add all admins to existing DM conversations
DO $$
DECLARE
  conv RECORD;
BEGIN
  FOR conv IN SELECT id FROM community_dm_conversations LOOP
    PERFORM ensure_admins_in_dm(conv.id);
  END LOOP;
END $$;
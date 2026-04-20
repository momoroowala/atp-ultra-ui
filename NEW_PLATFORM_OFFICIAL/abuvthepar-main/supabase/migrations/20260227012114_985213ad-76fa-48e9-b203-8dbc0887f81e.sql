
DROP TRIGGER IF EXISTS tr_add_admins_to_dm ON community_dm_conversations;
DROP FUNCTION IF EXISTS public.add_admins_to_new_dm();
DROP FUNCTION IF EXISTS public.ensure_admins_in_dm(uuid);
DROP FUNCTION IF EXISTS public.get_all_admin_ids();

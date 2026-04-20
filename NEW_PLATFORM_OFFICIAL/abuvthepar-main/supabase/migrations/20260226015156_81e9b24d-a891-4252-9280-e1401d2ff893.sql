
-- Add csm_panel to page_visibility for all roles
UPDATE public.roles 
SET page_visibility = page_visibility || '{"csm_panel": false}'::jsonb
WHERE role_key = 'client' AND page_visibility IS NOT NULL AND NOT (page_visibility ? 'csm_panel');

UPDATE public.roles 
SET page_visibility = page_visibility || '{"csm_panel": true}'::jsonb
WHERE role_key = 'admin' AND page_visibility IS NOT NULL AND NOT (page_visibility ? 'csm_panel');

UPDATE public.roles 
SET page_visibility = page_visibility || '{"csm_panel": true}'::jsonb
WHERE role_key = 'csm' AND page_visibility IS NOT NULL AND NOT (page_visibility ? 'csm_panel');

UPDATE public.roles 
SET page_visibility = page_visibility || '{"csm_panel": false}'::jsonb
WHERE role_key = 'executive' AND page_visibility IS NOT NULL AND NOT (page_visibility ? 'csm_panel');

UPDATE public.roles 
SET page_visibility = page_visibility || '{"csm_panel": true}'::jsonb
WHERE role_key = 'mega_admin' AND page_visibility IS NOT NULL AND NOT (page_visibility ? 'csm_panel');

-- Create RPC to get CSM user IDs
CREATE OR REPLACE FUNCTION public.get_csm_user_ids()
RETURNS TABLE(user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT up.id AS user_id
  FROM user_profiles up
  JOIN roles r ON up.role_id = r.id
  WHERE r.role_key = 'csm';
$$;

-- Create RPC to get admin-only user IDs
CREATE OR REPLACE FUNCTION public.get_admin_only_user_ids()
RETURNS TABLE(user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT up.id AS user_id
  FROM user_profiles up
  JOIN roles r ON up.role_id = r.id
  WHERE r.role_key = 'admin';
$$;

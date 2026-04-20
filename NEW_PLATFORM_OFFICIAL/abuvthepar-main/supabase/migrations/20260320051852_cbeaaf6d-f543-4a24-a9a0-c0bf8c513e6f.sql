
-- 1. Activate mega_admin role and sync page_visibility with admin
UPDATE public.roles
SET is_active = true,
    page_visibility = (SELECT page_visibility FROM public.roles WHERE role_key = 'admin')
WHERE role_key = 'mega_admin';

-- 2. Update get_admin_only_user_ids to return mega_admin users (for bug report routing)
CREATE OR REPLACE FUNCTION public.get_admin_only_user_ids()
 RETURNS TABLE(user_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT up.id AS user_id
  FROM user_profiles up
  JOIN roles r ON up.role_id = r.id
  WHERE r.role_key = 'mega_admin';
$$;


-- Insert the CSA role with the same page_visibility as CSM
INSERT INTO public.roles (role_key, display_name, description, is_active, role_order, page_visibility)
SELECT 'csa', 'CSA', 'Customer Success Associate', true, 3,
  (SELECT page_visibility FROM public.roles WHERE role_key = 'csm' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE role_key = 'csa');

-- Update is_staff() to include 'csa'
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    JOIN public.roles r ON r.id = up.role_id
    WHERE up.id = _user_id
      AND r.role_key IN ('admin', 'mega_admin', 'csm', 'executive', 'csa')
      AND up.is_active = true
  )
$$;

-- Update is_csm_only() to also match 'csa'
CREATE OR REPLACE FUNCTION public.is_csm_only(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.roles r ON r.id = up.role_id
    WHERE up.id = _user_id
      AND r.role_key IN ('csm', 'csa')
      AND up.is_active = true
  )
$$;

-- Update get_csm_user_ids() to include 'csa'
CREATE OR REPLACE FUNCTION public.get_csm_user_ids()
 RETURNS TABLE(user_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT up.id AS user_id
  FROM user_profiles up
  JOIN roles r ON up.role_id = r.id
  WHERE r.role_key IN ('csm', 'csa');
$$;

-- Update get_staff_user_ids() to include 'csa'
CREATE OR REPLACE FUNCTION public.get_staff_user_ids()
 RETURNS TABLE(user_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT up.id AS user_id
  FROM public.user_profiles up
  JOIN public.roles r ON r.id = up.role_id
  WHERE r.role_key IN ('admin', 'csm', 'csa')
    AND up.is_active = true;
$$;

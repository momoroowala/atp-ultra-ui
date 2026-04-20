
-- 1. Add page_visibility JSONB column to roles table
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS page_visibility jsonb DEFAULT '{}'::jsonb;

-- 2. Add page_visibility JSONB column to tiers table
ALTER TABLE public.tiers ADD COLUMN IF NOT EXISTS page_visibility jsonb DEFAULT '{}'::jsonb;

-- 3. Add csm and executive to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'csm';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'executive';

-- 4. Update is_admin() to remove mega_admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.roles r ON r.id = up.role_id
    WHERE up.id = _user_id AND r.role_key = 'admin' AND up.is_active = true
  )
$function$;

-- 5. Update get_staff_user_ids() to include csm
CREATE OR REPLACE FUNCTION public.get_staff_user_ids()
 RETURNS TABLE(user_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT up.id AS user_id
  FROM public.user_profiles up
  JOIN public.roles r ON r.id = up.role_id
  WHERE r.role_key IN ('admin', 'csm')
    AND up.is_active = true;
$function$;

-- 6. Update get_all_admin_ids() to include csm and executive
CREATE OR REPLACE FUNCTION public.get_all_admin_ids()
 RETURNS uuid[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(ARRAY_AGG(up.id), ARRAY[]::UUID[])
  FROM public.user_profiles up
  JOIN public.roles r ON r.id = up.role_id
  WHERE r.role_key IN ('admin', 'csm', 'executive') AND up.is_active = true
$function$;

-- 7. Update handle_mega_admin_signup to assign admin instead
CREATE OR REPLACE FUNCTION public.handle_mega_admin_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email = 'jesserogers@smarttradingblueprint.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- 8. Set default page_visibility for existing roles
UPDATE public.roles SET page_visibility = '{"home": true, "courses": true, "my_plan": true, "calendar": true, "community": true, "support": true, "admin_panel": false, "support_tickets": false}'::jsonb WHERE role_key = 'client';

UPDATE public.roles SET page_visibility = '{"home": true, "courses": true, "my_plan": true, "calendar": true, "community": true, "support": true, "admin_panel": true, "support_tickets": true}'::jsonb WHERE role_key = 'admin';

UPDATE public.roles SET page_visibility = '{"home": true, "courses": true, "my_plan": true, "calendar": true, "community": true, "support": true, "admin_panel": true, "support_tickets": true}'::jsonb WHERE role_key = 'mega_admin';

-- 9. Deactivate mega_admin
UPDATE public.roles SET is_active = false WHERE role_key = 'mega_admin';

-- 10. Insert CSM role
INSERT INTO public.roles (role_key, display_name, description, role_order, is_active, page_visibility)
VALUES ('csm', 'CSM', 'Customer Success Manager', 3, true, '{"home": true, "courses": true, "my_plan": true, "calendar": true, "community": true, "support": true, "admin_panel": true, "support_tickets": true}'::jsonb)
ON CONFLICT DO NOTHING;

-- 11. Insert Executive role
INSERT INTO public.roles (role_key, display_name, description, role_order, is_active, page_visibility)
VALUES ('executive', 'Executive', 'Executive role with statistics and user management access', 4, true, '{"home": true, "courses": true, "my_plan": true, "calendar": true, "community": true, "support": true, "admin_panel": true, "support_tickets": false}'::jsonb)
ON CONFLICT DO NOTHING;

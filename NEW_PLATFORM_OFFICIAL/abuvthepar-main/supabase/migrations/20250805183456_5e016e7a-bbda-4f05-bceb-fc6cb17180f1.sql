-- Add operations role to the app_role enum
ALTER TYPE public.app_role ADD VALUE 'operations';

-- Update the is_admin function to include operations role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'mega_admin', 'operations')
  )
$$;
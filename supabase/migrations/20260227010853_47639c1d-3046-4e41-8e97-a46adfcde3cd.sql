-- 1. Drop the broken recursive policy
DROP POLICY IF EXISTS "Users can view their assigned CSM profile" ON public.user_profiles;

-- 2. Create a security definer function (bypasses RLS, no recursion)
CREATE OR REPLACE FUNCTION public.get_my_assigned_csm_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT assigned_csm_id FROM public.user_profiles WHERE id = auth.uid();
$$;

-- Restrict execution to authenticated users
REVOKE EXECUTE ON FUNCTION public.get_my_assigned_csm_id FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_assigned_csm_id TO authenticated;

-- 3. Re-create the policy using the function
CREATE POLICY "Users can view their assigned CSM profile"
  ON public.user_profiles FOR SELECT
  USING (id = public.get_my_assigned_csm_id());
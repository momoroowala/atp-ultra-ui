CREATE OR REPLACE FUNCTION public.assign_csm_to_user(p_user_id uuid, p_csm_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: only staff can assign CSMs';
  END IF;

  UPDATE user_profiles
  SET assigned_csm_id = p_csm_id
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
END;
$$;
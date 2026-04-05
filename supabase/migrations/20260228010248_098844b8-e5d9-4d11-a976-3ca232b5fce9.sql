
-- 1. Create csm_delegations table
CREATE TABLE public.csm_delegations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_csm_id uuid NOT NULL REFERENCES public.user_profiles(id),
  delegate_csm_id uuid NOT NULL REFERENCES public.user_profiles(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create csm_delegation_assignments table
CREATE TABLE public.csm_delegation_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delegation_id uuid NOT NULL REFERENCES public.csm_delegations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.user_profiles(id)
);

-- 3. Enable RLS
ALTER TABLE public.csm_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csm_delegation_assignments ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies for csm_delegations
CREATE POLICY "Staff can read all delegations"
  ON public.csm_delegations FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "CSM or admin can insert delegations"
  ON public.csm_delegations FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_staff(auth.uid())
    AND original_csm_id = auth.uid()
  );

CREATE POLICY "Original CSM or admin can update delegations"
  ON public.csm_delegations FOR UPDATE
  TO authenticated
  USING (
    original_csm_id = auth.uid() OR public.is_admin(auth.uid())
  );

-- 5. RLS policies for csm_delegation_assignments
CREATE POLICY "Staff can read delegation assignments"
  ON public.csm_delegation_assignments FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

-- 6. Updated_at trigger
CREATE TRIGGER set_csm_delegations_updated_at
  BEFORE UPDATE ON public.csm_delegations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. activate_csm_delegation function
CREATE OR REPLACE FUNCTION public.activate_csm_delegation(p_delegation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_delegation RECORD;
BEGIN
  SELECT * INTO v_delegation FROM csm_delegations WHERE id = p_delegation_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Delegation not found or not in pending status';
  END IF;

  -- Snapshot and reassign students
  INSERT INTO csm_delegation_assignments (delegation_id, student_id)
  SELECT p_delegation_id, id
  FROM user_profiles
  WHERE assigned_csm_id = v_delegation.original_csm_id;

  UPDATE user_profiles
  SET assigned_csm_id = v_delegation.delegate_csm_id
  WHERE assigned_csm_id = v_delegation.original_csm_id;

  UPDATE csm_delegations SET status = 'active' WHERE id = p_delegation_id;
END;
$$;

-- 8. revert_csm_delegation function
CREATE OR REPLACE FUNCTION public.revert_csm_delegation(p_delegation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_delegation RECORD;
BEGIN
  SELECT * INTO v_delegation FROM csm_delegations WHERE id = p_delegation_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Delegation not found or not in active status';
  END IF;

  -- Revert students back to original CSM
  UPDATE user_profiles up
  SET assigned_csm_id = v_delegation.original_csm_id
  FROM csm_delegation_assignments cda
  WHERE cda.delegation_id = p_delegation_id
    AND cda.student_id = up.id;

  UPDATE csm_delegations SET status = 'completed' WHERE id = p_delegation_id;
END;
$$;

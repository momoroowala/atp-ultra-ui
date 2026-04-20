-- Ensure table exists
create table if not exists public.user_review_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  coach_id uuid not null references auth.users(id) on delete cascade,
  active boolean not null default true,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_review_assignments enable row level security;

-- Policies
DO $$ BEGIN
  BEGIN DROP POLICY "Admins can view assignments" ON public.user_review_assignments; EXCEPTION WHEN undefined_object THEN NULL; END;
  CREATE POLICY "Admins can view assignments" ON public.user_review_assignments FOR SELECT USING (is_admin(auth.uid()));

  BEGIN DROP POLICY "Admins can insert assignments" ON public.user_review_assignments; EXCEPTION WHEN undefined_object THEN NULL; END;
  CREATE POLICY "Admins can insert assignments" ON public.user_review_assignments FOR INSERT WITH CHECK (is_admin(auth.uid()));

  BEGIN DROP POLICY "Admins can update assignments" ON public.user_review_assignments; EXCEPTION WHEN undefined_object THEN NULL; END;
  CREATE POLICY "Admins can update assignments" ON public.user_review_assignments FOR UPDATE USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

  BEGIN DROP POLICY "Admins can delete assignments" ON public.user_review_assignments; EXCEPTION WHEN undefined_object THEN NULL; END;
  CREATE POLICY "Admins can delete assignments" ON public.user_review_assignments FOR DELETE USING (is_admin(auth.uid()));
END $$;

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_assignment_per_user ON public.user_review_assignments(user_id) WHERE active;
CREATE INDEX IF NOT EXISTS idx_assignments_coach ON public.user_review_assignments(coach_id) WHERE active;

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_assignments_updated_at ON public.user_review_assignments;
CREATE TRIGGER trg_assignments_updated_at
BEFORE UPDATE ON public.user_review_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function and trigger for trade_records
CREATE OR REPLACE FUNCTION public.apply_user_coach_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_coach uuid;
BEGIN
  IF NEW.assigned_to IS NULL THEN
    SELECT coach_id INTO v_coach
    FROM public.user_review_assignments
    WHERE user_id = NEW.user_id AND active = true
    LIMIT 1;

    IF v_coach IS NOT NULL THEN
      NEW.assigned_to := v_coach;
      NEW.assigned_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trade_records_apply_assignment ON public.trade_records;
CREATE TRIGGER trg_trade_records_apply_assignment
BEFORE INSERT ON public.trade_records
FOR EACH ROW EXECUTE FUNCTION public.apply_user_coach_assignment();
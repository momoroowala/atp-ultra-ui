
-- Master list of CSM-tracked milestones (staff-managed, separate from journey_milestones)
CREATE TABLE public.csm_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.csm_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view csm_milestones"
  ON public.csm_milestones FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage csm_milestones"
  ON public.csm_milestones FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- Per-client completion tracking
CREATE TABLE public.csm_milestone_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id uuid NOT NULL REFERENCES public.csm_milestones(id) ON DELETE CASCADE,
  client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_by uuid NOT NULL REFERENCES auth.users(id),
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(milestone_id, client_user_id)
);

ALTER TABLE public.csm_milestone_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view csm_milestone_completions"
  ON public.csm_milestone_completions FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage csm_milestone_completions"
  ON public.csm_milestone_completions FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- Action items for 1-on-1 calls
CREATE TABLE public.client_action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view client_action_items"
  ON public.client_action_items FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage client_action_items"
  ON public.client_action_items FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE INDEX idx_csm_milestone_completions_client ON public.csm_milestone_completions(client_user_id);
CREATE INDEX idx_client_action_items_client ON public.client_action_items(client_user_id);

-- Seed CSM milestones
INSERT INTO public.csm_milestones (title, sort_order) VALUES
  ('Complete Onboarding Call', 1),
  ('SME Account Created', 2),
  ('Existing Leads Listed', 3),
  ('Profile Optimized', 4),
  ('Content Plan Created', 5),
  ('First Post Published', 6),
  ('Engagement Strategy Started', 7),
  ('First Lead Generated', 8),
  ('First Pitch Sent', 9),
  ('First Deal Closed', 10),
  ('Revenue Milestone Hit', 11),
  ('Referral Made', 12);

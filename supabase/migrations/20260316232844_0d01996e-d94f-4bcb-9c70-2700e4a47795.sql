
-- Table: csm_outreach_status
-- Tracks per-student outreach status for intervention metrics
CREATE TABLE public.csm_outreach_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type text NOT NULL CHECK (metric_type IN ('never_logged_in', 'dead_on_arrival', 'at_risk', 'missed_onboarding')),
  status text NOT NULL DEFAULT 'follow_up_required' CHECK (status IN ('contacted', 'follow_up_required')),
  updated_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, metric_type)
);

ALTER TABLE public.csm_outreach_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all outreach statuses"
  ON public.csm_outreach_status FOR SELECT
  TO authenticated
  USING (is_staff(auth.uid()));

CREATE POLICY "Staff can insert outreach statuses"
  ON public.csm_outreach_status FOR INSERT
  TO authenticated
  WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "Staff can update outreach statuses"
  ON public.csm_outreach_status FOR UPDATE
  TO authenticated
  USING (is_staff(auth.uid()));

CREATE POLICY "Staff can delete outreach statuses"
  ON public.csm_outreach_status FOR DELETE
  TO authenticated
  USING (is_staff(auth.uid()));

-- Table: missed_onboarding_events
-- Receives webhook data for missed onboarding calls
CREATE TABLE public.missed_onboarding_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_call_time timestamptz NOT NULL,
  attendance_status text NOT NULL DEFAULT 'missed' CHECK (attendance_status IN ('missed', 'attended', 'rescheduled')),
  rescheduled boolean NOT NULL DEFAULT false,
  webhook_received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.missed_onboarding_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view missed onboarding events"
  ON public.missed_onboarding_events FOR SELECT
  TO authenticated
  USING (is_staff(auth.uid()));

CREATE POLICY "Staff can manage missed onboarding events"
  ON public.missed_onboarding_events FOR ALL
  TO authenticated
  USING (is_staff(auth.uid()))
  WITH CHECK (is_staff(auth.uid()));

-- Allow service role inserts for the webhook
CREATE POLICY "Service role can insert missed onboarding events"
  ON public.missed_onboarding_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger for updated_at on csm_outreach_status
CREATE TRIGGER update_csm_outreach_status_updated_at
  BEFORE UPDATE ON public.csm_outreach_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

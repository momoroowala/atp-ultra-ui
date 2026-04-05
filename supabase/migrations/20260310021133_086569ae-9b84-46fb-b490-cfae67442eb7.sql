
CREATE TABLE public.fathom_meeting_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid REFERENCES public.calendar_calls(id) ON DELETE SET NULL,
  recording_id uuid REFERENCES public.call_recordings(id) ON DELETE SET NULL,
  fathom_recording_id text UNIQUE NOT NULL,
  meeting_title text,
  summary text,
  transcript jsonb,
  action_items jsonb,
  fathom_meeting_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fathom_meeting_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage fathom notes"
  ON public.fathom_meeting_notes
  FOR ALL
  TO authenticated
  USING (is_staff(auth.uid()))
  WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "Authenticated users can view fathom notes"
  ON public.fathom_meeting_notes
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

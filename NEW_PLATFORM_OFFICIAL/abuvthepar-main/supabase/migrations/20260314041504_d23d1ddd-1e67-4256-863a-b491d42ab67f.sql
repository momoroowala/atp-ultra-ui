
-- Create journey_milestones table
CREATE TABLE public.journey_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_journey_milestones table
CREATE TABLE public.user_journey_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES public.journey_milestones(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, milestone_id)
);

-- Enable RLS
ALTER TABLE public.journey_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_journey_milestones ENABLE ROW LEVEL SECURITY;

-- journey_milestones policies
CREATE POLICY "Authenticated users can read milestones"
  ON public.journey_milestones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert milestones"
  ON public.journey_milestones FOR INSERT
  TO authenticated
  WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "Staff can update milestones"
  ON public.journey_milestones FOR UPDATE
  TO authenticated
  USING (is_staff(auth.uid()))
  WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "Staff can delete milestones"
  ON public.journey_milestones FOR DELETE
  TO authenticated
  USING (is_staff(auth.uid()));

-- user_journey_milestones policies
CREATE POLICY "Users can read own completions or staff can read all"
  ON public.user_journey_milestones FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_staff(auth.uid()));

CREATE POLICY "Users can insert own completions"
  ON public.user_journey_milestones FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions"
  ON public.user_journey_milestones FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


CREATE TABLE public.sprint_task_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sprint_task_id uuid NOT NULL REFERENCES public.sprint_tasks(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, sprint_task_id)
);

ALTER TABLE public.sprint_task_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
  ON public.sprint_task_notes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notes"
  ON public.sprint_task_notes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notes"
  ON public.sprint_task_notes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notes"
  ON public.sprint_task_notes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

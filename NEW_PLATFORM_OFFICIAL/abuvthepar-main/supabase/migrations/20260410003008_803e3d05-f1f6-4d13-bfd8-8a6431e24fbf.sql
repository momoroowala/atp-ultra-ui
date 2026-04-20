-- Create csm_dm_templates table
CREATE TABLE public.csm_dm_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  trigger_type TEXT NOT NULL DEFAULT 'manual',
  schedule_interval TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.csm_dm_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all templates"
  ON public.csm_dm_templates FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can create templates"
  ON public.csm_dm_templates FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update templates"
  ON public.csm_dm_templates FOR UPDATE
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete templates"
  ON public.csm_dm_templates FOR DELETE
  TO authenticated
  USING (public.is_staff(auth.uid()));

-- Auto-update updated_at
CREATE TRIGGER update_csm_dm_templates_updated_at
  BEFORE UPDATE ON public.csm_dm_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create csm_bulk_messages table
CREATE TABLE public.csm_bulk_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message_content TEXT NOT NULL,
  template_id UUID REFERENCES public.csm_dm_templates(id) ON DELETE SET NULL,
  recipient_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.csm_bulk_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all bulk messages"
  ON public.csm_bulk_messages FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can create bulk messages"
  ON public.csm_bulk_messages FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update bulk messages"
  ON public.csm_bulk_messages FOR UPDATE
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete bulk messages"
  ON public.csm_bulk_messages FOR DELETE
  TO authenticated
  USING (public.is_staff(auth.uid()));
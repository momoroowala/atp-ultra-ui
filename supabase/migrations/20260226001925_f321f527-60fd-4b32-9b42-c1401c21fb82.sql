
-- ============================================================
-- Support Ticket System: 5 tables + 1 function + 1 storage bucket
-- ============================================================

-- 1. support_tickets
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number SERIAL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  ticket_type TEXT NOT NULL DEFAULT 'support',
  topic TEXT,
  submitter_name TEXT,
  submitter_email TEXT,
  submitter_user_id UUID,
  submitter_tier_id UUID,
  attachments JSONB DEFAULT '[]'::jsonb,
  internal BOOLEAN DEFAULT false,
  has_new_reply BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (submitter_user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can create tickets" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own tickets" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (submitter_user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. ticket_responses
CREATE TABLE public.ticket_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  responder_name TEXT,
  responder_email TEXT,
  responder_user_id UUID,
  is_staff BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ticket_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view responses on own tickets" ON public.ticket_responses
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND (submitter_user_id = auth.uid() OR public.is_admin(auth.uid())))
  );

CREATE POLICY "Authenticated users can create responses" ON public.ticket_responses
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE TRIGGER update_ticket_responses_updated_at
  BEFORE UPDATE ON public.ticket_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. ticket_metadata (admin only)
CREATE TABLE public.ticket_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL UNIQUE REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  assigned_to_email TEXT,
  assigned_to_name TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  escalated BOOLEAN DEFAULT false,
  escalated_reason TEXT,
  escalated_at TIMESTAMPTZ,
  status_override TEXT,
  resolution_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ticket_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ticket metadata" ON public.ticket_metadata
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_ticket_metadata_updated_at
  BEFORE UPDATE ON public.ticket_metadata
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. ticket_internal_notes (admin only)
CREATE TABLE public.ticket_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  author_id UUID,
  author_name TEXT,
  author_email TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ticket_internal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage internal notes" ON public.ticket_internal_notes
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_ticket_internal_notes_updated_at
  BEFORE UPDATE ON public.ticket_internal_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. support_notifications
CREATE TABLE public.support_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.support_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.support_notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Anyone can insert notifications" ON public.support_notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON public.support_notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Function: get_staff_user_ids
CREATE OR REPLACE FUNCTION public.get_staff_user_ids()
RETURNS TABLE(user_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT up.id AS user_id
  FROM public.user_profiles up
  JOIN public.roles r ON r.id = up.role_id
  WHERE r.role_key IN ('admin', 'mega_admin')
    AND up.is_active = true;
$$;

-- Storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-attachments', 'ticket-attachments', true);

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload ticket attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ticket-attachments');

CREATE POLICY "Anyone can view ticket attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ticket-attachments');

CREATE POLICY "Admins can delete ticket attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ticket-attachments' AND public.is_admin(auth.uid()));

-- Enable realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_internal_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_metadata;

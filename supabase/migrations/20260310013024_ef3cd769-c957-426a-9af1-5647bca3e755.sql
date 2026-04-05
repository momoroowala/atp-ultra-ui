
-- Add google_calendar_event_id to calendar_calls
ALTER TABLE public.calendar_calls ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

-- Create system_settings key-value table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write system_settings
CREATE POLICY "Admins can manage system_settings" ON public.system_settings
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

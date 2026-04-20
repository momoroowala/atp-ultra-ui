-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create weekly_reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start_date DATE NOT NULL,
  report_content TEXT NOT NULL,
  insights JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

-- Enable RLS on weekly_reports
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- Users can view own reports
CREATE POLICY "Users can view own weekly reports"
ON public.weekly_reports
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all weekly reports"
ON public.weekly_reports
FOR SELECT
USING (is_admin(auth.uid()));

-- System can insert reports (service role)
CREATE POLICY "Service role can insert weekly reports"
ON public.weekly_reports
FOR INSERT
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_weekly_reports_updated_at
BEFORE UPDATE ON public.weekly_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Schedule weekly report generation for all active users every Monday at 6 AM UTC
SELECT cron.schedule(
  'generate-weekly-reports-monday',
  '0 6 * * 1',
  $$
  SELECT
    net.http_post(
        url:='https://turjtfcvxepwvxbdefag.supabase.co/functions/v1/generate-weekly-report',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1cmp0ZmN2eGVwd3Z4YmRlZmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MDI0ODgsImV4cCI6MjA2OTA3ODQ4OH0.UzjF8BvWHhU9f3Ek44dPbcMFjmMbS4WIJpNlRqDJDkQ"}'::jsonb,
        body:=json_build_object('runForAllUsers', true)::jsonb
    ) as request_id
  FROM (SELECT 1) as dummy;
  $$
);
-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to generate weekly reports every Monday at 6 AM UTC
SELECT cron.schedule(
  'generate-weekly-reports-for-all-users',
  '0 6 * * 1', -- Every Monday at 6 AM
  $$
  SELECT
    net.http_post(
        url:='https://turjtfcvxepwvxbdefag.supabase.co/functions/v1/generate-weekly-report',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1cmp0ZmN2eGVwd3Z4YmRlZmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwMDk0NTEsImV4cCI6MjA1MTU4NTQ1MX0.o9YWVuFWoZLV6uYL_4hxLxYUUIUEWQ6bDNkPfWnmwu0"}'::jsonb,
        body:=json_build_object('userId', id)::jsonb
    ) as request_id
  FROM auth.users
  WHERE id IS NOT NULL;
  $$
);
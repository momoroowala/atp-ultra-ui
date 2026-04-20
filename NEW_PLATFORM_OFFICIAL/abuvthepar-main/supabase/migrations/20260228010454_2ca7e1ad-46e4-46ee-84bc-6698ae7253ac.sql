
SELECT cron.schedule(
  'check-csm-delegations-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ygopchrmoshctzhzvzte.supabase.co/functions/v1/check-csm-delegations',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnb3BjaHJtb3NoY3R6aHp2enRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjY2NDAsImV4cCI6MjA4NjUwMjY0MH0.8hIUQVNsHnZptA_X3s_CrKP0sjiMYvcudm5e0f_4ylY"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);

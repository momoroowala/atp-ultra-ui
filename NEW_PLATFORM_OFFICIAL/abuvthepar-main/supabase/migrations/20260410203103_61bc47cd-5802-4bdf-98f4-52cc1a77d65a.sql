INSERT INTO missed_onboarding_events (user_email, user_id, scheduled_call_time, attendance_status, rescheduled)
VALUES (
  'khalil@scalingeasy.com',
  '134313ac-e173-4a0d-9ee0-28fce4d89ac4',
  now() - interval '3 days',
  'missed',
  false
);
ALTER TABLE public.missed_onboarding_events
  ALTER COLUMN scheduled_call_time SET DEFAULT now(),
  ALTER COLUMN scheduled_call_time DROP NOT NULL;
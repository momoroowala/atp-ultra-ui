
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS onboarding_booking_status text,
  ADD COLUMN IF NOT EXISTS onboarding_date timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_call_recording text,
  ADD COLUMN IF NOT EXISTS onboarding_call_summary text,
  ADD COLUMN IF NOT EXISTS onboarding_sheet_url text,
  ADD COLUMN IF NOT EXISTS offboarding_date date;

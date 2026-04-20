-- Backfill onboarding_date and offboarding_date for existing clients who completed onboarding
UPDATE public.user_profiles
SET 
  onboarding_date = COALESCE(onboarding_date, created_at),
  offboarding_date = COALESCE(offboarding_date, (COALESCE(onboarding_date, created_at)::date + INTERVAL '6 months')::date)
WHERE onboarding_completed = true
  AND role_id = '6d8d1e65-f743-46fd-aa0e-bb47def1ce53'
  AND (onboarding_date IS NULL OR offboarding_date IS NULL);
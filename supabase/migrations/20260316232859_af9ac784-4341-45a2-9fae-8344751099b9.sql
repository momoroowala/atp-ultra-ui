
-- Fix: Remove overly permissive INSERT policy and rely on the Staff ALL policy + service role for webhook inserts
DROP POLICY IF EXISTS "Service role can insert missed onboarding events" ON public.missed_onboarding_events;

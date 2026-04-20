UPDATE missed_onboarding_events
SET rescheduled = true
WHERE rescheduled = false
  AND user_id IN (
    SELECT id FROM user_profiles
    WHERE onboarding_booking_status = 'completed'
  );
-- Grant course access to all users with a tier but missing access records
INSERT INTO public.user_course_access (user_id, course_id)
SELECT up.id, c.id
FROM public.user_profiles up
CROSS JOIN public.courses c
WHERE up.tier_id IS NOT NULL
  AND c.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.user_course_access uca
    WHERE uca.user_id = up.id AND uca.course_id = c.id
  );
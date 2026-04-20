
-- Insert the EEC course
INSERT INTO public.courses (title, course_order, is_active, description)
VALUES ('EEC', 1, true, 'Structured Learning Engine — Master the fundamentals before execution.');

-- Insert 11 phases linked to the EEC course
WITH eec AS (SELECT id FROM public.courses WHERE title = 'EEC' LIMIT 1)
INSERT INTO public.phases (course_id, title, phase_order, is_active, requires_previous_completion)
SELECT eec.id, t.title, t.phase_order, true, true
FROM eec, (VALUES
  (1, 'Welcome to EEC'),
  (2, 'Module 1 — How to Get Setup'),
  (3, 'Module 2 — Marketplace Basics'),
  (4, 'Module 3 — Sourcing Brands'),
  (5, 'Module 4 — Sourcing Suppliers'),
  (6, 'Module 5 — Sourcing Products'),
  (7, 'Module 6 — Ordering & Shipping'),
  (8, 'Module 7 — Inventory Management'),
  (9, 'Module 8 — Brand Optimization'),
  (10, 'Module 9 — Account Health'),
  (11, 'Module 10 — Hiring & Funding the Business')
) AS t(phase_order, title);

-- Grant course access to all existing users
INSERT INTO public.user_course_access (user_id, course_id)
SELECT up.id, c.id
FROM public.user_profiles up
CROSS JOIN (SELECT id FROM public.courses WHERE title = 'EEC' LIMIT 1) c
ON CONFLICT DO NOTHING;

ALTER TABLE public.user_course_access ADD COLUMN access_type text DEFAULT 'granted';
ALTER TABLE public.user_course_access ADD COLUMN notes text;
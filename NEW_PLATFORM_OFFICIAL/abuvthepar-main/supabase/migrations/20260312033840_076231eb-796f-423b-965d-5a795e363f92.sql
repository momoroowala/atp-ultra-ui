-- Add one_on_ones: true to all active roles' page_visibility
UPDATE public.roles
SET page_visibility = page_visibility || '{"one_on_ones": true}'::jsonb
WHERE is_active = true;

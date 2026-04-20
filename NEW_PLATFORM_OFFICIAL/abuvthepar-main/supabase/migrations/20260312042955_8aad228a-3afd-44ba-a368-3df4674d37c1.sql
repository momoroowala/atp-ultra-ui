
-- Update page_visibility for tiers (Platinum and Diamond)
UPDATE public.tiers 
SET page_visibility = COALESCE(page_visibility, '{}'::jsonb) || '{"brand_leads": true}'::jsonb
WHERE tier_key IN ('platinum', 'diamond');

-- Update page_visibility for roles (admin, csm, executive)
UPDATE public.roles
SET page_visibility = COALESCE(page_visibility, '{}'::jsonb) || '{"brand_leads": true}'::jsonb
WHERE role_key IN ('admin', 'csm', 'executive');

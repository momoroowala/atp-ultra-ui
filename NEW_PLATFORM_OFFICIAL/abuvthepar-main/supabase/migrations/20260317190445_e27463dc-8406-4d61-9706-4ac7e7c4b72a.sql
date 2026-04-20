
-- Remove one_on_ones default from client role
UPDATE roles 
SET page_visibility = jsonb_set(
  COALESCE(page_visibility, '{}'::jsonb), 
  '{one_on_ones}', 
  'false'
)
WHERE role_key = 'client';

-- Grant one_on_ones to Platinum tier
UPDATE tiers 
SET page_visibility = jsonb_set(
  COALESCE(page_visibility::jsonb, '{}'::jsonb), 
  '{one_on_ones}', 
  'true'
)
WHERE tier_key = 'platinum';

-- Grant one_on_ones to Diamond tier
UPDATE tiers 
SET page_visibility = jsonb_set(
  COALESCE(page_visibility::jsonb, '{}'::jsonb), 
  '{one_on_ones}', 
  'true'
)
WHERE tier_key = 'diamond';

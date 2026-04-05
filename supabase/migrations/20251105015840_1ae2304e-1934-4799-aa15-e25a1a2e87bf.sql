-- Drop existing restrictive RLS policy
DROP POLICY IF EXISTS "Users can view unlocked phases based on tier and unlock status" ON phases;

-- Create new policy - show ALL active phases without unlock checks
CREATE POLICY "Users can view all active phases for accessible courses"
ON phases FOR SELECT
TO public
USING (
  is_active = true 
  AND (
    EXISTS (SELECT 1 FROM tiers WHERE tiers.tier_key = 'all' AND tiers.id = ANY(phases.visible_tier_ids))
    OR EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.tier_id = ANY(phases.visible_tier_ids))
    OR EXISTS (SELECT 1 FROM user_roles ur JOIN tiers t ON t.tier_key = ur.role::text WHERE ur.user_id = auth.uid() AND t.id = ANY(phases.visible_tier_ids))
  )
);

-- Update Week 2 to immediate unlock
UPDATE phases 
SET 
  unlock_type = 'time',
  unlock_delay_days = 0,
  required_phase_id = NULL,
  unlock_condition = jsonb_build_object(
    'delay_days', 0,
    'task_unlock_strategy', 'all_at_once'
  )
WHERE id = 'd43e6114-26c4-4d3b-9ee0-aed1936b9ee8';

-- Update Weeks 3-8 to immediate unlock
UPDATE phases 
SET 
  unlock_type = 'time',
  unlock_delay_days = 0,
  required_phase_id = NULL,
  unlock_condition = jsonb_build_object(
    'delay_days', 0,
    'task_unlock_strategy', 'all_at_once'
  )
WHERE id IN (
  '0efe98c4-5587-4ab0-aece-06a2ee6b7c85',
  'a5e962b9-e721-482a-aee9-216d568b004c',
  'de734dbd-2fa3-467c-a704-a70187a6ea8b',
  '388ad791-c9ef-4671-9356-ff3d9ebddb0f',
  '120f1e8d-7ede-4b50-88f6-f6e58904c66e',
  'e9f862b0-b43f-442a-a351-9e3525b37409'
);

-- Update Bonus Phases to immediate unlock
UPDATE phases 
SET 
  unlock_type = 'time',
  unlock_delay_days = 0,
  required_phase_id = NULL,
  unlock_condition = jsonb_build_object(
    'delay_days', 0,
    'task_unlock_strategy', 'all_at_once'
  )
WHERE id IN (
  '396ef19b-35f8-4490-9860-a7b11688500f',
  '735d4491-8271-426f-a514-97116ba8af6c',
  '19bbc992-e723-479a-9038-3d65d3723f6a'
);
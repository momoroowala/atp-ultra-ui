-- Drop existing restrictive RLS policy on tasks
DROP POLICY IF EXISTS "Users can view unlocked tasks based on tier and unlock status" ON tasks;

-- Create admin policy for tasks (see all tasks for management)
CREATE POLICY "Admins can view all tasks for management"
ON tasks FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Create user policy for tasks (tier-based + unlock check)
CREATE POLICY "Users can view unlocked tasks based on tier"
ON tasks FOR SELECT
TO public
USING (
  is_active = true 
  AND (
    EXISTS (SELECT 1 FROM tiers WHERE tiers.tier_key = 'all' AND tiers.id = ANY(tasks.visible_tier_ids))
    OR EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.tier_id = ANY(tasks.visible_tier_ids))
    OR EXISTS (SELECT 1 FROM user_roles ur JOIN tiers t ON t.tier_key = ur.role::text WHERE ur.user_id = auth.uid() AND t.id = ANY(tasks.visible_tier_ids))
  )
  AND is_task_unlocked(id, auth.uid())
)
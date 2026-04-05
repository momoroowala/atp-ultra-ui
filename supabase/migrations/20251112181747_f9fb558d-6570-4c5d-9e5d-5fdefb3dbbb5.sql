-- Update RLS policy to allow all authenticated users to view all active calls
-- The tier-based access control is handled in the UI (Join vs Unlock button)

DROP POLICY IF EXISTS "Users can view accessible calls" ON calendar_calls;

CREATE POLICY "All authenticated users can view active calls"
ON calendar_calls
FOR SELECT
TO authenticated
USING (is_active = true);
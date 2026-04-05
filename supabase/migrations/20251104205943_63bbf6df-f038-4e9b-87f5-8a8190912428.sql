-- Allow admins to update any user profile (needed for changing role_id and tier_id)
-- This complements existing policies that only allow users to update their own profile

-- Create UPDATE policy for admins on user_profiles
CREATE POLICY "Admins can update any profile"
ON public.user_profiles
FOR UPDATE
USING (is_admin(auth.uid()));

-- Add admin delete policy for trader_profiles table
-- This allows admins to delete/reset user profiles when needed

CREATE POLICY "admins can delete any trader profile"
ON public.trader_profiles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.roles r ON r.id = up.role_id
    WHERE up.id = auth.uid()
      AND r.role_key IN ('admin', 'mega_admin')
      AND up.is_active = true
  )
);

-- Also add admin update policy to allow admins to edit any profile
CREATE POLICY "admins can update any trader profile"
ON public.trader_profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.roles r ON r.id = up.role_id
    WHERE up.id = auth.uid()
      AND r.role_key IN ('admin', 'mega_admin')
      AND up.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.roles r ON r.id = up.role_id
    WHERE up.id = auth.uid()
      AND r.role_key IN ('admin', 'mega_admin')
      AND up.is_active = true
  )
);

-- Add admin select policy to allow admins to view any profile
CREATE POLICY "admins can select any trader profile"
ON public.trader_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.roles r ON r.id = up.role_id
    WHERE up.id = auth.uid()
      AND r.role_key IN ('admin', 'mega_admin')
      AND up.is_active = true
  )
);
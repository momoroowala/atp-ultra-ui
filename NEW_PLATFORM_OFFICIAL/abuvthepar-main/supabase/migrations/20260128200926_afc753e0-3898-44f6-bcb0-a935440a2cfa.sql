-- Fix user_login_streaks public exposure
-- Drop any overly permissive policies and ensure only owner access

-- First, drop any existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own login streaks" ON public.user_login_streaks;
DROP POLICY IF EXISTS "Users can manage own login streaks" ON public.user_login_streaks;
DROP POLICY IF EXISTS "Anyone can view login streaks" ON public.user_login_streaks;
DROP POLICY IF EXISTS "Public can view login streaks" ON public.user_login_streaks;

-- Ensure RLS is enabled
ALTER TABLE public.user_login_streaks ENABLE ROW LEVEL SECURITY;

-- Create owner-only SELECT policy
CREATE POLICY "Users can view own login streaks"
ON public.user_login_streaks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create owner-only INSERT policy
CREATE POLICY "Users can insert own login streaks"
ON public.user_login_streaks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create owner-only UPDATE policy
CREATE POLICY "Users can update own login streaks"
ON public.user_login_streaks
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create admin access policy for viewing all streaks (needed for dashboard metrics edge function)
CREATE POLICY "Admins can view all login streaks"
ON public.user_login_streaks
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));
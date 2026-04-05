-- Drop any existing overly permissive policies on user_ai_interactions
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_ai_interactions;
DROP POLICY IF EXISTS "Public read access" ON public.user_ai_interactions;
DROP POLICY IF EXISTS "Allow public read" ON public.user_ai_interactions;

-- Create secure RLS policies for user_ai_interactions
-- Users can only view their own AI interaction history
CREATE POLICY "Users can view own AI interactions"
ON public.user_ai_interactions
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

-- Users can insert their own AI interactions
CREATE POLICY "Users can create own AI interactions"
ON public.user_ai_interactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own AI interactions
CREATE POLICY "Users can update own AI interactions"
ON public.user_ai_interactions
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id);

-- Admins can view all AI interactions for support purposes
CREATE POLICY "Admins can view all AI interactions"
ON public.user_ai_interactions
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));
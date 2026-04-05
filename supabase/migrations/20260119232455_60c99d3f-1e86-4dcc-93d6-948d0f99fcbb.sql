-- Add INSERT policy for admins to add credits
CREATE POLICY "Admins can insert credits"
ON public.ugc_video_credits
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Add UPDATE policy for admins
CREATE POLICY "Admins can update credits"
ON public.ugc_video_credits
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Add UPDATE policy for users to update their own (for consuming credits)
CREATE POLICY "Users can update own credits"
ON public.ugc_video_credits
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
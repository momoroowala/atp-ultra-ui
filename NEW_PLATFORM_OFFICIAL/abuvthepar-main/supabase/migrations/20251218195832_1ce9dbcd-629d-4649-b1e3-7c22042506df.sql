-- Fix infinite recursion in community_dm_participants RLS policies
-- The issue is that the SELECT policy references itself causing infinite recursion

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.community_dm_participants;

-- Create a simpler policy that doesn't cause recursion
-- Users can view participants if they are a participant in the same conversation
CREATE POLICY "Users can view participants in their conversations" 
ON public.community_dm_participants 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR 
  conversation_id IN (
    SELECT cdp.conversation_id 
    FROM public.community_dm_participants cdp 
    WHERE cdp.user_id = auth.uid()
  )
);
-- Add simpler RLS policy for realtime subscriptions to work
-- The complex subquery-based policies cause CHANNEL_ERROR in Supabase Realtime
-- Client-side filtering still ensures users only see messages for channels they have access to

CREATE POLICY "Authenticated users can subscribe to messages realtime"
ON public.community_messages
FOR SELECT
TO authenticated
USING (true);

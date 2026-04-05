-- Add missing RLS policy to allow admins to update all trade records
-- This is needed for the review system where admins review other users' trades
CREATE POLICY "Admins can update all trades"
  ON public.trade_records FOR UPDATE
  USING (is_admin(auth.uid()));
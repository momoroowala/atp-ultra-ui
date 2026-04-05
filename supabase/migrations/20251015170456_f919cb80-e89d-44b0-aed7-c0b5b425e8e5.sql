-- Enable RLS on market_snapshot table
ALTER TABLE public.market_snapshot ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all market snapshots
CREATE POLICY "Authenticated users can view market snapshots"
ON public.market_snapshot
FOR SELECT
TO authenticated
USING (true);

-- Allow admins to manage market snapshots
CREATE POLICY "Admins can manage market snapshots"
ON public.market_snapshot
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
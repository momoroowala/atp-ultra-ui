-- Add review-related columns to trade_records table
ALTER TABLE public.trade_records
ADD COLUMN review_status TEXT DEFAULT 'open' CHECK (review_status IN ('open', 'completed')),
ADD COLUMN review_feedback TEXT,
ADD COLUMN reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN assigned_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX idx_trade_records_review_status ON public.trade_records(review_status);
CREATE INDEX idx_trade_records_assigned_to ON public.trade_records(assigned_to);
CREATE INDEX idx_trade_records_reviewed_by ON public.trade_records(reviewed_by);

-- Add RLS policy for admins/ops to view all trades for review
CREATE POLICY "Admins and ops can view all trades for review"
ON public.trade_records
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'mega_admin'::app_role) OR 
  has_role(auth.uid(), 'operations'::app_role)
);

-- Add RLS policy for admins/ops to update review fields
CREATE POLICY "Admins and ops can update review fields"
ON public.trade_records
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'mega_admin'::app_role) OR 
  has_role(auth.uid(), 'operations'::app_role)
);
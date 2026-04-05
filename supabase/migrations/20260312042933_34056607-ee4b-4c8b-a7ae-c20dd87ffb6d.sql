
-- Create brand_leads table
CREATE TABLE public.brand_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_brand_name text NOT NULL,
  category text,
  contact_name text,
  email text,
  phone text,
  last_email_sent_date date,
  status text NOT NULL DEFAULT 'Email Sent',
  business_model text NOT NULL DEFAULT 'Brand',
  website text,
  state text,
  amazon_lead_product_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brand_leads ENABLE ROW LEVEL SECURITY;

-- Users can view their own leads
CREATE POLICY "Users can view own leads"
  ON public.brand_leads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own leads
CREATE POLICY "Users can insert own leads"
  ON public.brand_leads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own leads
CREATE POLICY "Users can update own leads"
  ON public.brand_leads FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Users can delete their own leads
CREATE POLICY "Users can delete own leads"
  ON public.brand_leads FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Staff can view all leads for oversight
CREATE POLICY "Staff can view all leads"
  ON public.brand_leads FOR SELECT
  TO authenticated
  USING (is_staff(auth.uid()));

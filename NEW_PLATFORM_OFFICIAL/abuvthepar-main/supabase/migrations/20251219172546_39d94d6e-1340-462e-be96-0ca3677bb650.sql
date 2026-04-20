-- Create table for Facebook ad connections
CREATE TABLE public.facebook_ad_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  facebook_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  ad_account_id TEXT,
  ad_account_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for Facebook ad metrics
CREATE TABLE public.facebook_ad_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connection_id UUID REFERENCES public.facebook_ad_connections(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  date DATE NOT NULL,
  spend NUMERIC DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  cpm NUMERIC DEFAULT 0,
  cpc NUMERIC DEFAULT 0,
  add_to_carts INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  purchase_value NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, campaign_id, date)
);

-- Enable RLS
ALTER TABLE public.facebook_ad_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_ad_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for facebook_ad_connections
CREATE POLICY "Users can view their own connections"
ON public.facebook_ad_connections
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connections"
ON public.facebook_ad_connections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections"
ON public.facebook_ad_connections
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections"
ON public.facebook_ad_connections
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for facebook_ad_metrics
CREATE POLICY "Users can view their own metrics"
ON public.facebook_ad_metrics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics"
ON public.facebook_ad_metrics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metrics"
ON public.facebook_ad_metrics
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own metrics"
ON public.facebook_ad_metrics
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_facebook_ad_connections_user_id ON public.facebook_ad_connections(user_id);
CREATE INDEX idx_facebook_ad_metrics_user_id ON public.facebook_ad_metrics(user_id);
CREATE INDEX idx_facebook_ad_metrics_date ON public.facebook_ad_metrics(date);
CREATE INDEX idx_facebook_ad_metrics_campaign_id ON public.facebook_ad_metrics(campaign_id);

-- Add triggers for updated_at
CREATE TRIGGER update_facebook_ad_connections_updated_at
  BEFORE UPDATE ON public.facebook_ad_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facebook_ad_metrics_updated_at
  BEFORE UPDATE ON public.facebook_ad_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
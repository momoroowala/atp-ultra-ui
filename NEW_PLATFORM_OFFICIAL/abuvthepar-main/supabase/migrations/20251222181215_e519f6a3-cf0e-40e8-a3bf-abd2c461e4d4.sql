-- Add ad_account_id column to facebook_ad_metrics
ALTER TABLE public.facebook_ad_metrics 
ADD COLUMN IF NOT EXISTS ad_account_id TEXT;

-- Update the unique constraint to include ad_account_id
ALTER TABLE public.facebook_ad_metrics 
DROP CONSTRAINT IF EXISTS facebook_ad_metrics_user_id_campaign_id_date_key;

ALTER TABLE public.facebook_ad_metrics 
ADD CONSTRAINT facebook_ad_metrics_unique_key 
UNIQUE (user_id, ad_account_id, campaign_id, date);
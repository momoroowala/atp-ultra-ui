-- Add Shopify-related columns to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS shopify_access_token TEXT,
ADD COLUMN IF NOT EXISTS shopify_shop_domain TEXT,
ADD COLUMN IF NOT EXISTS shopify_shop_name TEXT,
ADD COLUMN IF NOT EXISTS shopify_connected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS shopify_plan_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.shopify_access_token IS 'Encrypted Shopify API access token';
COMMENT ON COLUMN public.user_profiles.shopify_shop_domain IS 'Shopify store domain (e.g., mystore.myshopify.com)';
COMMENT ON COLUMN public.user_profiles.shopify_shop_name IS 'Shopify store display name';
COMMENT ON COLUMN public.user_profiles.shopify_connected_at IS 'Timestamp when Shopify was connected';
COMMENT ON COLUMN public.user_profiles.shopify_plan_name IS 'Current Shopify plan name for activation status';
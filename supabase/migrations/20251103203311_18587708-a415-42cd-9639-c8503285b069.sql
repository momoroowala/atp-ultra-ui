-- Add feature_access column to tiers table
ALTER TABLE tiers 
ADD COLUMN feature_access JSONB DEFAULT '{
  "smart_trader_ai": false,
  "market_snapshot": false,
  "enigma_calculator": false,
  "trader_dashboard": false,
  "trade_reviews": false
}'::jsonb;

-- Update existing tiers with full access for backward compatibility
UPDATE tiers 
SET feature_access = '{
  "smart_trader_ai": true,
  "market_snapshot": true,
  "enigma_calculator": true,
  "trader_dashboard": true,
  "trade_reviews": true
}'::jsonb
WHERE tier_key IN ('client_stb', 'client_midticket', 'all');

-- Create function to check feature access
CREATE OR REPLACE FUNCTION has_feature_access(_user_id uuid, _feature_key text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tier_id uuid;
  feature_enabled boolean;
BEGIN
  -- Get user's tier_id
  SELECT tier_id INTO user_tier_id
  FROM user_profiles
  WHERE id = _user_id;
  
  -- If no tier assigned, deny access
  IF user_tier_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if feature is enabled for this tier
  SELECT COALESCE((feature_access->>_feature_key)::boolean, false) INTO feature_enabled
  FROM tiers
  WHERE id = user_tier_id AND is_active = true;
  
  RETURN COALESCE(feature_enabled, false);
END;
$$;

-- Add RLS policy for trade_records to filter by trade_reviews access
CREATE POLICY "Admins can view trades from tiers with review access"
ON trade_records
FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN tiers t ON t.id = up.tier_id
    WHERE up.id = trade_records.user_id
    AND COALESCE((t.feature_access->>'trade_reviews')::boolean, false) = true
  )
);
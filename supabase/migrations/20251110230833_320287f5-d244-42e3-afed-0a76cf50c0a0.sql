-- Add feature_visibility column to tiers table
ALTER TABLE tiers 
ADD COLUMN IF NOT EXISTS feature_visibility jsonb DEFAULT '{
  "smart_trader_ai": true,
  "market_maker_ai": true,
  "market_snapshot": true,
  "enigma_calculator": true,
  "trader_dashboard": true,
  "roadmap": true
}'::jsonb;

-- Update existing tiers to have all features visible by default
UPDATE tiers
SET feature_visibility = '{
  "smart_trader_ai": true,
  "market_maker_ai": true,
  "market_snapshot": true,
  "enigma_calculator": true,
  "trader_dashboard": true,
  "roadmap": true
}'::jsonb
WHERE feature_visibility IS NULL;
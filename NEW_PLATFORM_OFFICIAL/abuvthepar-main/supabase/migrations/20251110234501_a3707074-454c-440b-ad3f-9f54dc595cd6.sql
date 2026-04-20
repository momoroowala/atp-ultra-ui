-- Add crisp_chat_visible to feature_visibility default value
ALTER TABLE tiers 
ALTER COLUMN feature_visibility 
SET DEFAULT '{
  "smart_trader_ai": true,
  "market_maker_ai": true,
  "market_snapshot": true,
  "enigma_calculator": true,
  "trader_dashboard": true,
  "roadmap": true,
  "crisp_chat_visible": true
}'::jsonb;

-- Backfill existing tiers with crisp_chat_visible = true
UPDATE tiers
SET feature_visibility = 
  COALESCE(feature_visibility, '{}'::jsonb) || 
  '{"crisp_chat_visible": true}'::jsonb
WHERE feature_visibility IS NULL 
   OR NOT (feature_visibility ? 'crisp_chat_visible');
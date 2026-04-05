-- Add market_maker_ai to feature_access defaults
ALTER TABLE tiers 
ALTER COLUMN feature_access 
SET DEFAULT '{
  "smart_trader_ai": false,
  "market_maker_ai": false,
  "market_snapshot": false,
  "enigma_calculator": false,
  "trader_dashboard": false,
  "trade_reviews": false,
  "roadmap": false
}'::jsonb;

-- Update existing tiers to include market_maker_ai
UPDATE tiers
SET feature_access = feature_access || '{"market_maker_ai": false}'::jsonb
WHERE NOT feature_access ? 'market_maker_ai';

-- Add Market Maker AI N8N webhook URL to app_config
INSERT INTO app_config (config_key, config_value, description)
VALUES (
  'n8n_webhook_url_market_maker',
  'https://n8n.scalingeasy.com/webhook/6c89d634-8ebf-4cef-99a3-be4125b6c76c',
  'N8N webhook URL for Market Maker AI agent'
)
ON CONFLICT (config_key) DO UPDATE 
SET config_value = EXCLUDED.config_value;
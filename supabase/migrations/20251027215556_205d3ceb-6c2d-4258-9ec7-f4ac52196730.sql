-- Update N8N webhook URL to the new endpoint
UPDATE app_config 
SET config_value = 'https://n8n.scalingeasy.com/webhook/6e93d080-014f-4548-a6ca-70617ee0d89b/chat',
    updated_at = NOW()
WHERE config_key = 'n8n_webhook_url';
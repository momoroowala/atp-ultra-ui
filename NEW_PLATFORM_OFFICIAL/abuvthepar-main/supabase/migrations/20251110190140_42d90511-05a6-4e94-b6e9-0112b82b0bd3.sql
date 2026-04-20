-- Drop the existing check constraint
ALTER TABLE ai_chat_sessions 
DROP CONSTRAINT IF EXISTS ai_chat_sessions_agent_type_check;

-- Add a new check constraint that includes market_maker_ai
ALTER TABLE ai_chat_sessions 
ADD CONSTRAINT ai_chat_sessions_agent_type_check 
CHECK (agent_type IN ('smart_trader_ai', 'assessment', 'market_maker_ai'));
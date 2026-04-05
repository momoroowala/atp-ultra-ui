-- First, update any existing rows that have invalid agent_type values
-- Set them to a default valid value
UPDATE ai_chat_sessions 
SET agent_type = 'freestyle' 
WHERE agent_type NOT IN ('psychology', 'risk_management', 'strategy_entries', 'accountability', 'freestyle');

-- Drop the existing check constraint
ALTER TABLE ai_chat_sessions 
DROP CONSTRAINT IF EXISTS ai_chat_sessions_agent_type_check;

-- Add a new check constraint with the correct agent types
ALTER TABLE ai_chat_sessions 
ADD CONSTRAINT ai_chat_sessions_agent_type_check 
CHECK (agent_type IN ('psychology', 'risk_management', 'strategy_entries', 'accountability', 'freestyle'));
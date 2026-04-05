-- Add new columns to ai_chat_sessions for session management
ALTER TABLE ai_chat_sessions
ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'ai_chat' CHECK (session_type IN ('ai_chat', 'assessment')),
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS assessment_title TEXT,
ADD COLUMN IF NOT EXISTS assessment_handle TEXT,
ADD COLUMN IF NOT EXISTS agent_type TEXT DEFAULT 'smart_trader_ai' CHECK (agent_type IN ('smart_trader_ai', 'assessment'));

-- Create index for faster querying of non-archived sessions
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_archived ON ai_chat_sessions(user_id, is_archived, last_message_at DESC);

-- Update existing sessions to have default values
UPDATE ai_chat_sessions 
SET session_type = 'ai_chat', 
    is_archived = false,
    agent_type = 'smart_trader_ai'
WHERE session_type IS NULL OR is_archived IS NULL OR agent_type IS NULL;
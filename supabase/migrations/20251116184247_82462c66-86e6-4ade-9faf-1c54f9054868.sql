-- Add attachments column to ai_chat_messages table
ALTER TABLE ai_chat_messages 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
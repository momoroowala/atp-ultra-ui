-- Add last_read_at column to community_user_channel_settings for tracking unread messages
ALTER TABLE public.community_user_channel_settings 
ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_channel_settings_last_read 
ON public.community_user_channel_settings (user_id, channel_id, last_read_at);

-- Create a new table for DM read tracking (since DMs don't use community_user_channel_settings)
CREATE TABLE IF NOT EXISTS public.community_dm_read_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL REFERENCES public.community_dm_conversations(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, conversation_id)
);

-- Enable RLS
ALTER TABLE public.community_dm_read_status ENABLE ROW LEVEL SECURITY;

-- RLS policies for dm read status
CREATE POLICY "Users can view own read status" 
ON public.community_dm_read_status 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own read status" 
ON public.community_dm_read_status 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own read status" 
ON public.community_dm_read_status 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Index for DM read status
CREATE INDEX IF NOT EXISTS idx_dm_read_status_user_conversation 
ON public.community_dm_read_status (user_id, conversation_id);
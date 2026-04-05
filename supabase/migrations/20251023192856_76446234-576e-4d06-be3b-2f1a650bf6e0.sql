-- Create ai_chat_sessions table
CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_title TEXT NOT NULL,
  agent_type TEXT NOT NULL DEFAULT 'psychology',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_chat_messages table
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  agent_persona TEXT,
  citations JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_chat_sessions
CREATE POLICY "Users can view own chat sessions"
  ON public.ai_chat_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions"
  ON public.ai_chat_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON public.ai_chat_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
  ON public.ai_chat_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for ai_chat_messages
CREATE POLICY "Users can view messages from own sessions"
  ON public.ai_chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_chat_sessions
      WHERE ai_chat_sessions.id = ai_chat_messages.session_id
      AND ai_chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own sessions"
  ON public.ai_chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_chat_sessions
      WHERE ai_chat_sessions.id = ai_chat_messages.session_id
      AND ai_chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in own sessions"
  ON public.ai_chat_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_chat_sessions
      WHERE ai_chat_sessions.id = ai_chat_messages.session_id
      AND ai_chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in own sessions"
  ON public.ai_chat_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_chat_sessions
      WHERE ai_chat_sessions.id = ai_chat_messages.session_id
      AND ai_chat_sessions.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_ai_chat_sessions_user_id ON public.ai_chat_sessions(user_id);
CREATE INDEX idx_ai_chat_sessions_last_message_at ON public.ai_chat_sessions(last_message_at DESC);
CREATE INDEX idx_ai_chat_messages_session_id ON public.ai_chat_messages(session_id);
CREATE INDEX idx_ai_chat_messages_created_at ON public.ai_chat_messages(created_at);
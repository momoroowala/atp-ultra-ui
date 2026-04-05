-- Create ai_chat_sessions table
CREATE TABLE public.ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('psychology', 'risk', 'strategy', 'coach', 'freestyle')),
  session_title TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

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

-- Create ai_chat_messages table
CREATE TABLE public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  agent_persona TEXT,
  citations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can insert messages to own sessions"
  ON public.ai_chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_chat_sessions
      WHERE ai_chat_sessions.id = ai_chat_messages.session_id
        AND ai_chat_sessions.user_id = auth.uid()
    )
  );

-- Create notebook_entries table
CREATE TABLE public.notebook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.ai_chat_messages(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]'::jsonb,
  pinned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notebook_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notebook_entries
CREATE POLICY "Users can view own notebook entries"
  ON public.notebook_entries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notebook entries"
  ON public.notebook_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notebook entries"
  ON public.notebook_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_ai_chat_sessions_user_id ON public.ai_chat_sessions(user_id);
CREATE INDEX idx_ai_chat_sessions_session_id ON public.ai_chat_sessions(session_id);
CREATE INDEX idx_ai_chat_messages_session_id ON public.ai_chat_messages(session_id);
CREATE INDEX idx_notebook_entries_user_id ON public.notebook_entries(user_id);

-- Create trigger for updated_at on ai_chat_sessions
CREATE TRIGGER update_ai_chat_sessions_updated_at
  BEFORE UPDATE ON public.ai_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
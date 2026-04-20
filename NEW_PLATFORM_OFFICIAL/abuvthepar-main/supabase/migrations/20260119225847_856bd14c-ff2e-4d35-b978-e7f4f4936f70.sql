-- Table for tracking all video generation requests
CREATE TABLE public.ugc_video_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_id TEXT,
  product_name TEXT,
  product_url TEXT,
  image_url TEXT,
  aspect_ratio TEXT DEFAULT 'portrait',
  status TEXT DEFAULT 'pending',
  video_url TEXT,
  prompt_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Table for tracking user video credits
CREATE TABLE public.ugc_video_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  credits_amount INTEGER NOT NULL,
  credits_remaining INTEGER NOT NULL,
  credit_type TEXT NOT NULL,
  source TEXT,
  granted_by UUID,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for credit transaction audit log
CREATE TABLE public.ugc_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  credit_id UUID REFERENCES public.ugc_video_credits(id),
  transaction_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER,
  video_generation_id UUID REFERENCES public.ugc_video_generations(id),
  description TEXT,
  performed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.ugc_video_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ugc_video_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ugc_credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for ugc_video_generations
CREATE POLICY "Users can view own videos" ON public.ugc_video_generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own videos" ON public.ugc_video_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own videos" ON public.ugc_video_generations
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for ugc_video_credits
CREATE POLICY "Users can view own credits" ON public.ugc_video_credits
  FOR SELECT USING (auth.uid() = user_id);

-- RLS policies for ugc_credit_transactions
CREATE POLICY "Users can view own transactions" ON public.ugc_credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_ugc_video_generations_user_id ON public.ugc_video_generations(user_id);
CREATE INDEX idx_ugc_video_generations_status ON public.ugc_video_generations(status);
CREATE INDEX idx_ugc_video_credits_user_id ON public.ugc_video_credits(user_id);
CREATE INDEX idx_ugc_video_credits_expires_at ON public.ugc_video_credits(expires_at);
CREATE INDEX idx_ugc_credit_transactions_user_id ON public.ugc_credit_transactions(user_id);
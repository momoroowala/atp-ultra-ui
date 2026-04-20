-- Create trading_accounts table
CREATE TABLE public.trading_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  current_balance NUMERIC NOT NULL,
  peak_balance NUMERIC NOT NULL,
  trailing_drawdown NUMERIC NOT NULL,
  win_rate NUMERIC NOT NULL DEFAULT 80,
  risk_reward NUMERIC NOT NULL DEFAULT 3,
  experience_level TEXT NOT NULL,
  trading_session TEXT,
  trades_per_week INTEGER,
  time_for_trades TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;

-- Users can view their own accounts
CREATE POLICY "Users can view own trading accounts"
ON public.trading_accounts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own accounts
CREATE POLICY "Users can insert own trading accounts"
ON public.trading_accounts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own accounts
CREATE POLICY "Users can update own trading accounts"
ON public.trading_accounts
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own accounts
CREATE POLICY "Users can delete own trading accounts"
ON public.trading_accounts
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all accounts
CREATE POLICY "Admins can view all trading accounts"
ON public.trading_accounts
FOR SELECT
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_trading_accounts_updated_at
BEFORE UPDATE ON public.trading_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create enigma_calculations table
CREATE TABLE public.enigma_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number INTEGER NOT NULL,
  trailing_drawdown NUMERIC NOT NULL,
  win_rate NUMERIC NOT NULL,
  risk_reward NUMERIC NOT NULL,
  max_consecutive_trades INTEGER NOT NULL,
  conservative_risk NUMERIC,
  neutral_risk NUMERIC,
  aggressive_risk NUMERIC,
  coefficient_a INTEGER,
  coefficient_b INTEGER,
  coefficient_c INTEGER,
  remainder NUMERIC,
  is_negative BOOLEAN DEFAULT FALSE,
  is_zero BOOLEAN DEFAULT FALSE,
  all_possible_triples TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_enigma_lookup ON public.enigma_calculations(
  trailing_drawdown, win_rate, risk_reward
);

-- Enable RLS
ALTER TABLE public.enigma_calculations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "All authenticated users can view calculations"
  ON public.enigma_calculations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage calculations"
  ON public.enigma_calculations FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create losing_streak_probabilities table
CREATE TABLE public.losing_streak_probabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  win_rate NUMERIC NOT NULL,
  max_consecutive_trades INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(win_rate)
);

-- Index for lookups
CREATE INDEX idx_losing_streak_lookup ON public.losing_streak_probabilities(win_rate);

-- Enable RLS
ALTER TABLE public.losing_streak_probabilities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "All authenticated users can view probabilities"
  ON public.losing_streak_probabilities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage probabilities"
  ON public.losing_streak_probabilities FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- Update trading_accounts table
ALTER TABLE public.trading_accounts 
ADD COLUMN IF NOT EXISTS max_consecutive_trades INTEGER;

-- Add trigger for updated_at on enigma_calculations
CREATE TRIGGER update_enigma_calculations_updated_at
  BEFORE UPDATE ON public.enigma_calculations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
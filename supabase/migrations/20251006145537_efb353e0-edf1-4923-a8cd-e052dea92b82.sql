-- Create trade_records table
CREATE TABLE public.trade_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_date DATE NOT NULL,
  entry_model TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('win', 'loss', 'breakeven')),
  profit_loss DECIMAL(10, 2) NOT NULL DEFAULT 0,
  emotions TEXT,
  screenshot_url TEXT,
  stop_loss DECIMAL(10, 2),
  target DECIMAL(10, 2),
  reflection TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create daily_reviews table
CREATE TABLE public.daily_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_date DATE NOT NULL,
  review_type TEXT NOT NULL CHECK (review_type IN ('pre_market', 'post_market')),
  news_releases TEXT,
  expected_figures TEXT,
  htf_bias TEXT,
  intraday_bias TEXT,
  expectations TEXT,
  what_happened TEXT,
  what_learned TEXT,
  daily_pnl DECIMAL(10, 2),
  trades_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, review_date, review_type)
);

-- Create weekly_checkins table
CREATE TABLE public.weekly_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  what_worked TEXT,
  what_didnt_work TEXT,
  trade_patterns TEXT,
  market_patterns TEXT,
  mistakes JSONB,
  habits JSONB,
  recurring_problems TEXT,
  solutions TEXT,
  action_steps TEXT,
  growth_notes TEXT,
  market_study TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

-- Create milestone_type enum
CREATE TYPE public.milestone_type AS ENUM (
  'first_live_call',
  'onboarding_complete',
  'first_green_day',
  'first_funded_account',
  'first_payout',
  '5k_month',
  'program_complete'
);

-- Create user_milestones table
CREATE TABLE public.user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type milestone_type NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, milestone_type)
);

-- Create trading_metrics_cache table
CREATE TABLE public.trading_metrics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('daily', 'monthly', 'lifetime')),
  period_start_date DATE NOT NULL,
  win_ratio DECIMAL(5, 2),
  total_profit DECIMAL(10, 2),
  trades_taken INTEGER DEFAULT 0,
  entry_models_breakdown JSONB,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, period, period_start_date)
);

-- Enable RLS on all tables
ALTER TABLE public.trade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_metrics_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trade_records
CREATE POLICY "Users can view own trades"
  ON public.trade_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades"
  ON public.trade_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades"
  ON public.trade_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trades"
  ON public.trade_records FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all trades"
  ON public.trade_records FOR SELECT
  USING (is_admin(auth.uid()));

-- RLS Policies for daily_reviews
CREATE POLICY "Users can view own reviews"
  ON public.daily_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reviews"
  ON public.daily_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON public.daily_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reviews"
  ON public.daily_reviews FOR SELECT
  USING (is_admin(auth.uid()));

-- RLS Policies for weekly_checkins
CREATE POLICY "Users can view own checkins"
  ON public.weekly_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins"
  ON public.weekly_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins"
  ON public.weekly_checkins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all checkins"
  ON public.weekly_checkins FOR SELECT
  USING (is_admin(auth.uid()));

-- RLS Policies for user_milestones
CREATE POLICY "Users can view own milestones"
  ON public.user_milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own milestones"
  ON public.user_milestones FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all milestones"
  ON public.user_milestones FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for trading_metrics_cache
CREATE POLICY "Users can view own metrics"
  ON public.trading_metrics_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics"
  ON public.trading_metrics_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metrics"
  ON public.trading_metrics_cache FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all metrics"
  ON public.trading_metrics_cache FOR SELECT
  USING (is_admin(auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_trade_records_updated_at
  BEFORE UPDATE ON public.trade_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_reviews_updated_at
  BEFORE UPDATE ON public.daily_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trading_metrics_cache_updated_at
  BEFORE UPDATE ON public.trading_metrics_cache
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Initialize milestones for all existing users
INSERT INTO public.user_milestones (user_id, milestone_type)
SELECT 
  u.id,
  m.milestone_type
FROM auth.users u
CROSS JOIN (
  SELECT unnest(enum_range(NULL::milestone_type)) AS milestone_type
) m
ON CONFLICT (user_id, milestone_type) DO NOTHING;
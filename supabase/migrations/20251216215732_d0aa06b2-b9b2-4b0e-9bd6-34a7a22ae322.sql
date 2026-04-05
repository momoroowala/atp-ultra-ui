-- Create weekly_checkins table
CREATE TABLE public.weekly_checkins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  week_start_date date NOT NULL,
  journaled_all_trades boolean,
  what_worked text,
  what_didnt_work text,
  trade_patterns text,
  market_patterns text,
  mistakes text,
  traded_plan boolean,
  followed_rules boolean,
  overtrade boolean,
  revenge_trade boolean,
  held_too_long boolean,
  exit_too_early boolean,
  moved_stop_loss boolean,
  added_to_loser boolean,
  took_profit_early boolean,
  recurring_problems text,
  solutions text,
  action_steps text,
  growth_notes text,
  market_study text,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

-- Enable RLS
ALTER TABLE public.weekly_checkins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own checkins" ON public.weekly_checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON public.weekly_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON public.weekly_checkins
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all checkins" ON public.weekly_checkins
  FOR SELECT USING (is_admin(auth.uid()));
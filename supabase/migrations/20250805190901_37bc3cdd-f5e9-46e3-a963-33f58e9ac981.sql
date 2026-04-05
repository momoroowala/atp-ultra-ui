ALTER TABLE public.trader_profiles
  ADD COLUMN IF NOT EXISTS success_definition text,
  ADD COLUMN IF NOT EXISTS stress_baseline integer,
  ADD COLUMN IF NOT EXISTS review_habit text,
  ADD COLUMN IF NOT EXISTS learning_style text,
  ADD COLUMN IF NOT EXISTS habit_loss_raw text,
  ADD COLUMN IF NOT EXISTS weekly_opt_in boolean DEFAULT false;
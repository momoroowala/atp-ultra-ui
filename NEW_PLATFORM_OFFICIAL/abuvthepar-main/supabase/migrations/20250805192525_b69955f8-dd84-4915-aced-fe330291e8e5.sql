-- Update weekly_opt_in column to use string instead of boolean
ALTER TABLE public.trader_profiles 
ALTER COLUMN weekly_opt_in TYPE text;
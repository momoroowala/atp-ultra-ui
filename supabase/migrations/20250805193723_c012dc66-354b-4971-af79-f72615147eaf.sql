-- Change weekly_opt_in back to boolean to match the current code expectations
ALTER TABLE public.trader_profiles 
ALTER COLUMN weekly_opt_in TYPE boolean 
USING (weekly_opt_in = 'yes');
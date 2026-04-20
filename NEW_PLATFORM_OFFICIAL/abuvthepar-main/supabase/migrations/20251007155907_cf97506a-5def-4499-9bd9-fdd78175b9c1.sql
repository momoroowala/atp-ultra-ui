-- Add new columns to weekly_checkins table
ALTER TABLE public.weekly_checkins
ADD COLUMN IF NOT EXISTS journaled_all_trades boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS traded_plan boolean,
ADD COLUMN IF NOT EXISTS followed_rules boolean,
ADD COLUMN IF NOT EXISTS overtrade boolean,
ADD COLUMN IF NOT EXISTS revenge_trade boolean,
ADD COLUMN IF NOT EXISTS held_too_long boolean,
ADD COLUMN IF NOT EXISTS exit_too_early boolean,
ADD COLUMN IF NOT EXISTS moved_stop_loss boolean,
ADD COLUMN IF NOT EXISTS added_to_loser boolean,
ADD COLUMN IF NOT EXISTS took_profit_early boolean;

-- Convert mistakes column from jsonb to text if needed
-- First, let's alter the column type
ALTER TABLE public.weekly_checkins
ALTER COLUMN mistakes TYPE text USING mistakes::text;

-- Remove habits column as it's no longer needed
ALTER TABLE public.weekly_checkins
DROP COLUMN IF EXISTS habits;
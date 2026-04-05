-- Update trade_records table for new Trade Journal structure

-- Add new columns for emotional questions (Yes/No)
ALTER TABLE public.trade_records
ADD COLUMN emotions_affected_decisions BOOLEAN,
ADD COLUMN emotionally_stable BOOLEAN,
ADD COLUMN cared_about_outcome BOOLEAN;

-- Add new text columns for detailed trade analysis
ALTER TABLE public.trade_records
ADD COLUMN profit_target_question TEXT,
ADD COLUMN stop_loss_question TEXT,
ADD COLUMN entry_logic TEXT,
ADD COLUMN trade_execution TEXT,
ADD COLUMN coach_notes TEXT;

-- Update outcome column to use new values (green, red, breakeven)
-- First, update existing data
UPDATE public.trade_records
SET outcome = CASE
  WHEN outcome = 'win' THEN 'green'
  WHEN outcome = 'loss' THEN 'red'
  ELSE outcome
END;

-- Drop old CHECK constraint if exists and add new one
ALTER TABLE public.trade_records
DROP CONSTRAINT IF EXISTS trade_records_outcome_check;

ALTER TABLE public.trade_records
ADD CONSTRAINT trade_records_outcome_check 
CHECK (outcome IN ('green', 'red', 'breakeven'));

-- Rename profit_loss to be clearer
ALTER TABLE public.trade_records
RENAME COLUMN profit_loss TO total_profit;

-- Drop columns that are being replaced by new text questions
ALTER TABLE public.trade_records
DROP COLUMN IF EXISTS stop_loss,
DROP COLUMN IF EXISTS target,
DROP COLUMN IF EXISTS reflection;

-- Make screenshot_url NOT NULL (mandatory)
-- First, update any NULL values to empty string (shouldn't be any with current validation)
UPDATE public.trade_records
SET screenshot_url = ''
WHERE screenshot_url IS NULL;

-- Note: We keep emotions column but will use it as a dropdown selection now
-- The column type TEXT is fine for storing the selected emotion value
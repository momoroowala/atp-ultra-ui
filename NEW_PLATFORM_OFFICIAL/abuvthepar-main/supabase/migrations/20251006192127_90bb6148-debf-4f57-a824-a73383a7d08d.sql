-- Add currency column to trade_records table
ALTER TABLE public.trade_records 
ADD COLUMN currency text NOT NULL DEFAULT 'USD';

-- Add a check constraint to ensure valid currency codes
ALTER TABLE public.trade_records
ADD CONSTRAINT valid_currency CHECK (currency IN ('USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR'));
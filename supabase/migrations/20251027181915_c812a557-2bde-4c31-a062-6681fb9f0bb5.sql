-- Remove peak_balance column from trading_accounts table
ALTER TABLE trading_accounts DROP COLUMN IF EXISTS peak_balance;
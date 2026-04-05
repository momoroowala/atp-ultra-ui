-- Add commission columns to trading_accounts table
ALTER TABLE trading_accounts
ADD COLUMN commission_cl numeric DEFAULT 3.96 NOT NULL,
ADD COLUMN commission_mcl numeric DEFAULT 1.26 NOT NULL,
ADD COLUMN commission_es numeric DEFAULT 2.16 NOT NULL,
ADD COLUMN commission_mes numeric DEFAULT 0.62 NOT NULL,
ADD COLUMN commission_nq numeric DEFAULT 2.16 NOT NULL,
ADD COLUMN commission_mnq numeric DEFAULT 0.62 NOT NULL,
ADD COLUMN commission_ym numeric DEFAULT 2.16 NOT NULL,
ADD COLUMN commission_mym numeric DEFAULT 0.62 NOT NULL;
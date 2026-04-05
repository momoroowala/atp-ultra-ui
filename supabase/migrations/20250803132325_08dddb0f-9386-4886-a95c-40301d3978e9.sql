-- 1. Add feature_mode column if it doesn't exist
ALTER TABLE public.prompt_catalog
ADD COLUMN IF NOT EXISTS feature_mode text NOT NULL DEFAULT 'assessment';

-- 2. Populate existing rows
UPDATE public.prompt_catalog
SET    feature_mode = 'assessment'
WHERE  feature_mode IS NULL;

-- 3. Comment for future devs
COMMENT ON COLUMN public.prompt_catalog.feature_mode IS
'Which product feature this prompt belongs to (assessment | psychology_pdf | strategy_pdf | bootcamp | etc.)';
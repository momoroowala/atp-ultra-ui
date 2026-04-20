-- Add unique constraint to case_number for upsert operations
ALTER TABLE enigma_calculations ADD CONSTRAINT enigma_calculations_case_number_key UNIQUE (case_number);
-- Add store activation columns to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS store_activated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS store_url TEXT;
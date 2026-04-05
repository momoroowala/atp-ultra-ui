-- Add upsell_funnel_url column to tiers table
ALTER TABLE public.tiers 
ADD COLUMN upsell_funnel_url text;
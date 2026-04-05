-- Add upsell_funnel_url column to courses table
ALTER TABLE courses 
ADD COLUMN upsell_funnel_url text;
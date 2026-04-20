-- Add catalog_visible_tier_ids column to courses table for controlling catalog visibility
ALTER TABLE courses 
ADD COLUMN catalog_visible_tier_ids uuid[] DEFAULT ARRAY[]::uuid[];

-- Backfill existing courses to be visible to all tiers that have access
UPDATE courses 
SET catalog_visible_tier_ids = visible_tier_ids 
WHERE catalog_visible_tier_ids = ARRAY[]::uuid[];
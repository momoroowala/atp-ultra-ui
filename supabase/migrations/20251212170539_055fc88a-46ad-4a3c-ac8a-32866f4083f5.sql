-- Add visible_tier_ids column to announcements table
ALTER TABLE public.announcements 
ADD COLUMN visible_tier_ids uuid[] DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.announcements.visible_tier_ids IS 'Array of tier IDs that can see this announcement. NULL or empty means all tiers can see it.';
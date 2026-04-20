-- Fix existing calendar_calls data to properly populate visible_tier_ids and use display_names in visible_tiers
-- This updates all calls that have tier restrictions

DO $$
DECLARE
  call_record RECORD;
  tier_record RECORD;
  tier_ids uuid[];
  tier_names text[];
BEGIN
  -- Loop through all calendar calls that have visible_tiers set
  FOR call_record IN 
    SELECT id, visible_tiers 
    FROM calendar_calls 
    WHERE visible_tiers IS NOT NULL 
      AND array_length(visible_tiers, 1) > 0
  LOOP
    tier_ids := ARRAY[]::uuid[];
    tier_names := ARRAY[]::text[];
    
    -- For each tier_key in visible_tiers, get the corresponding tier id and display_name
    FOR tier_record IN 
      SELECT id, display_name 
      FROM tiers 
      WHERE tier_key = ANY(call_record.visible_tiers)
    LOOP
      tier_ids := array_append(tier_ids, tier_record.id);
      tier_names := array_append(tier_names, tier_record.display_name);
    END LOOP;
    
    -- Update the call with the proper tier_ids and display_names
    UPDATE calendar_calls 
    SET 
      visible_tier_ids = tier_ids,
      visible_tiers = tier_names
    WHERE id = call_record.id;
  END LOOP;
END $$;
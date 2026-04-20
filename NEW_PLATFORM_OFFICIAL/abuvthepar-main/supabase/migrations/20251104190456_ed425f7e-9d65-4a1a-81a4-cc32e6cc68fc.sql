-- Migration: Sync phase and task visibility with course visibility
-- This ensures all phases and tasks inherit their course's visible_tier_ids

-- Update all phases to match their course's visible_tier_ids
UPDATE phases p
SET visible_tier_ids = c.visible_tier_ids
FROM courses c
WHERE p.course_id = c.id;

-- Update all tasks to match their course's visible_tier_ids (via phase)
UPDATE tasks t
SET visible_tier_ids = c.visible_tier_ids
FROM phases p
JOIN courses c ON p.course_id = c.id
WHERE t.phase_id = p.id;
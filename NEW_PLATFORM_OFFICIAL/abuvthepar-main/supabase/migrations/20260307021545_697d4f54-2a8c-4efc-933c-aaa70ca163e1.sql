-- Clear visible_tier_ids on all EEC course tasks so any user with course access can see content
UPDATE tasks SET visible_tier_ids = NULL
WHERE phase_id IN (
  SELECT id FROM phases WHERE course_id = 'e01ad39f-2bf6-42d5-b354-27962cc77be5'
);
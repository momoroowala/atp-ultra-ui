UPDATE courses
SET 
  visible_tier_ids = array_cat(
    COALESCE(visible_tier_ids, '{}'),
    ARRAY['99c701de-d9f3-488e-a8b7-9d1a8bffb4b8', '69aeba07-a7a2-43f5-83bf-b5687dc4c50f']::uuid[]
  ),
  catalog_visible_tier_ids = array_cat(
    COALESCE(catalog_visible_tier_ids, '{}'),
    ARRAY['99c701de-d9f3-488e-a8b7-9d1a8bffb4b8', '69aeba07-a7a2-43f5-83bf-b5687dc4c50f']::uuid[]
  )
WHERE id = 'e01ad39f-2bf6-42d5-b354-27962cc77be5';
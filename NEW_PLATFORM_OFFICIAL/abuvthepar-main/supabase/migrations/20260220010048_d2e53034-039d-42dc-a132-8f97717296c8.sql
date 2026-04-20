INSERT INTO courses (title, description, is_active, course_order, catalog_visible_tier_ids, visible_tier_ids)
VALUES (
  'Test Course',
  'This is a test course to preview the course catalog page.',
  true,
  999,
  (SELECT catalog_visible_tier_ids FROM courses WHERE is_active = true LIMIT 1),
  (SELECT visible_tier_ids FROM courses WHERE is_active = true LIMIT 1)
);
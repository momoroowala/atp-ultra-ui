-- Make Amazon Wholesale task visible on course page
UPDATE tasks SET show_in_course = true
WHERE id = '311dff50-37ca-4400-b3db-369cb1595ffc';

-- Add mock video section to Welcome task
INSERT INTO discipline_task_sections (task_id, section_type, title, data, order_index)
VALUES (
  'aeb028df-6dbc-4aff-9b63-bcd83a21dcb6',
  'video',
  'Welcome to EEC',
  '{"video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}',
  0
);

-- Add mock video section to Amazon Wholesale task
INSERT INTO discipline_task_sections (task_id, section_type, title, data, order_index)
VALUES (
  '311dff50-37ca-4400-b3db-369cb1595ffc',
  'video',
  'What is Amazon Wholesale & FBA vs FBM',
  '{"video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}',
  0
);
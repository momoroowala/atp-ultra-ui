-- Delete empty form sections from discipline_task_sections
DELETE FROM discipline_task_sections
WHERE section_type = 'form'
  AND (data IS NULL OR data::text = '{}');
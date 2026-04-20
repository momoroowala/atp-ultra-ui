-- 1 · Rename old archetype labels to the new tags
UPDATE micro_lessons SET archetype = 'unstructured_trader'
  WHERE archetype = 'System_Free_Trader';

UPDATE micro_lessons SET archetype = 'fearful_hesitator'
  WHERE archetype = 'Hesitator';

UPDATE micro_lessons SET archetype = 'reckless_trader'
  WHERE archetype = 'Discipline_Dropper';

-- 2 · Verify the result
SELECT archetype, count(*) 
FROM micro_lessons
GROUP BY archetype
ORDER BY archetype;
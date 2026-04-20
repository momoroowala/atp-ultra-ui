-- Create Week 3 Exam Quiz
INSERT INTO quizzes (
  title,
  description,
  passing_grade,
  linked_phase_id,
  is_active,
  created_at,
  updated_at
) VALUES (
  'Week 3 Exam',
  'Comprehensive exam covering Week 3 concepts including liquidity principles, displacement, draw on liquidity, market maker models, and liquidity-based bias formation.',
  70,
  '0efe98c4-5587-4ab0-aece-06a2ee6b7c85', -- Week 3 Phase ID
  true,
  now(),
  now()
);

-- Get the quiz ID we just created (for reference in questions)
-- Insert questions for Week 3 Exam
INSERT INTO quiz_questions (
  quiz_id,
  question_text,
  question_order,
  answer_options,
  correct_answer_id,
  created_at,
  updated_at
) 
SELECT 
  q.id as quiz_id,
  'Liquidity is less important than other pillars of trading.' as question_text,
  1 as question_order,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb as answer_options,
  '2' as correct_answer_id,
  now() as created_at,
  now() as updated_at
FROM quizzes q WHERE q.title = 'Week 3 Exam'

UNION ALL

SELECT 
  q.id,
  'The draw on liquidity is ________.',
  2,
  '[{"id":"1","text":"The current price objective for a given time frame"},{"id":"2","text":"The current support or resistance"},{"id":"3","text":"The level where price is currently trading at"},{"id":"4","text":"The entry level of our trades"}]'::jsonb,
  '1',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 3 Exam'

UNION ALL

SELECT 
  q.id,
  'Displacement is irrelevant to identifying the current draw on liquidity.',
  3,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 3 Exam'

UNION ALL

SELECT 
  q.id,
  'If the higher time frames are bullish, and we are looking at the 5-minute chart that is in a premium, price is likely to ______________.',
  4,
  '[{"id":"1","text":"Reverse and go for the low of the range (sell-side liquidity)"},{"id":"2","text":"Continue endlessly because price is bullish"},{"id":"3","text":"Retrace into discount of the 5-minute range and take liquidity to then continue up"},{"id":"4","text":"Retrace into the discount of the weekly time frame"}]'::jsonb,
  '1',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 3 Exam'

UNION ALL

SELECT 
  q.id,
  'The first step in forming a liquidity-based bias is asking yourself what liquidity was taken recently.',
  5,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '1',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 3 Exam'

UNION ALL

SELECT 
  q.id,
  'Market Maker Models are the process of __________.',
  6,
  '[{"id":"1","text":"Support and resistance creation"},{"id":"2","text":"Low-probability trading conditions"},{"id":"3","text":"The process of order pairing"}]'::jsonb,
  '3',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 3 Exam'

UNION ALL

SELECT 
  q.id,
  'Market Maker Models do not have to align with bias.',
  7,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 3 Exam';

-- Link Week 3 Exam as a requirement to unlock Week 4 (Phase 5)
INSERT INTO phase_quiz_requirements (
  phase_id,
  quiz_id,
  is_required,
  created_at
)
SELECT 
  'a5e962b9-e721-482a-aee9-216d568b004c' as phase_id, -- Week 4 Phase ID
  q.id as quiz_id,
  true as is_required,
  now() as created_at
FROM quizzes q 
WHERE q.title = 'Week 3 Exam';
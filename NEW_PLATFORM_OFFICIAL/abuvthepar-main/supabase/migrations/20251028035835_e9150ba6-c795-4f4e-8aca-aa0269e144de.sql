-- Create Week 4 Exam Quiz
INSERT INTO quizzes (
  title,
  description,
  passing_grade,
  linked_phase_id,
  is_active,
  created_at,
  updated_at
) VALUES (
  'Week 4 Exam',
  'Advanced exam covering time and price concepts, trading sessions (Asian, London, NY), weekly patterns, Smart Trading lifecycle (accumulation, manipulation, distribution), and lifestyle-based trading strategies. Must achieve 100% to pass.',
  100,
  'a5e962b9-e721-482a-aee9-216d568b004c', -- Week 4 Phase ID
  true,
  now(),
  now()
);

-- Insert 18 questions for Week 4 Exam
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
  'On a bullish day, we are looking to buy ________.' as question_text,
  1 as question_order,
  '[{"id":"1","text":"Below the open"},{"id":"2","text":"At the open"},{"id":"3","text":"Above the open"}]'::jsonb as answer_options,
  '1' as correct_answer_id,
  now() as created_at,
  now() as updated_at
FROM quizzes q WHERE q.title = 'Week 4 Exam'

UNION ALL

SELECT 
  q.id,
  'The visual of time and price concepts are more important than the concepts.',
  2,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 4 Exam'

UNION ALL

SELECT 
  q.id,
  'The high or low of the week is likely to be put in on Monday.',
  3,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '1',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 4 Exam'

UNION ALL

SELECT 
  q.id,
  'Time efficiency is only important for beginners.',
  4,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 4 Exam'

UNION ALL

SELECT 
  q.id,
  'Lifestyle is an important factor to consider when determining your trading style.',
  5,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '1',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 4 Exam'

UNION ALL

SELECT 
  q.id,
  'Your lifestyle must be molded around your trading style.',
  6,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 4 Exam'

UNION ALL

SELECT 
  q.id,
  'Sessions are irrelevant to your trading style.',
  7,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 4 Exam'

UNION ALL

SELECT 
  q.id,
  'The Asian Session is known to be expansive and provide many opportunities.',
  8,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 4 Exam'

UNION ALL

SELECT 
  q.id,
  'The Asian Session''s job is to ________.',
  9,
  '[{"id":"1","text":"Put in the high or low of the day"},{"id":"2","text":"Build liquidity for the upcoming day"},{"id":"3","text":"Give a trade entry"},{"id":"4","text":"Put in the high/low of the week"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 4 Exam'

UNION ALL

SELECT 
  q.id,
  'The London Session is known to be flat and uneventful.',
  10,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 4 Exam'

UNION ALL

SELECT 
  q.id,
  'All time-based concepts are meant to be used on ________.',
  11,
  '[{"id":"1","text":"Pacific Standard Time"},{"id":"2","text":"Mountain Standard Time"},{"id":"3","text":"Central Standard Time"},{"id":"4","text":"Eastern Standard Time"}]'::jsonb,
  '4',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 4 Exam'

UNION ALL

SELECT 
  q.id,
  'The NYO begins at 5am.',
  12,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 4 Exam'

UNION ALL

SELECT 
  q.id,
  'There is no manipulation in the PM session, only continuation.',
  13,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 4 Exam'

UNION ALL

SELECT 
  q.id,
  'We look for accumulation in the later portions of defined ranges of time.',
  14,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 4 Exam'

UNION ALL

SELECT 
  q.id,
  'If the market is trending, the high or low of the week is likely to be put in on ________.',
  15,
  '[{"id":"1","text":"Monday or Friday"},{"id":"2","text":"Thursday or Monday"},{"id":"3","text":"Tuesday or Wednesday"},{"id":"4","text":"Tuesday or Thursday"}]'::jsonb,
  '3',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 4 Exam'

UNION ALL

SELECT 
  q.id,
  'The Smart Trading life cycle is ________.',
  16,
  '[{"id":"1","text":"Market maker model, order block, fair value gap"},{"id":"2","text":"Breaker block, order block, accumulation"},{"id":"3","text":"Expansion, retracement, expansion"},{"id":"4","text":"Accumulation, manipulation, distribution"}]'::jsonb,
  '4',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 4 Exam'

UNION ALL

SELECT 
  q.id,
  'Our goal as traders is to catch the ________.',
  17,
  '[{"id":"1","text":"Bottom 25% of the candle body before it expands"},{"id":"2","text":"A ride on the train once the candle is expanding"},{"id":"3","text":"The wick of the candle"},{"id":"4","text":"The mid-point of the body of the candle"}]'::jsonb,
  '1',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 4 Exam'

UNION ALL

SELECT 
  q.id,
  'Opening prices are useful when we have no bias.',
  18,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '1',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 4 Exam';

-- Link Week 4 Exam as a requirement to unlock Week 5 (Phase 6)
INSERT INTO phase_quiz_requirements (
  phase_id,
  quiz_id,
  is_required,
  created_at
)
SELECT 
  'de734dbd-2fa3-467c-a704-a70187a6ea8b' as phase_id, -- Week 5 Phase ID
  q.id as quiz_id,
  true as is_required,
  now() as created_at
FROM quizzes q 
WHERE q.title = 'Week 4 Exam';
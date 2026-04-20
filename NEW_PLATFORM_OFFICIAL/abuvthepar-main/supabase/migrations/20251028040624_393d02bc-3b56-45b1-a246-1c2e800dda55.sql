-- Create Week 6 Exam Quiz
-- This quiz tests advanced intermarket analysis, SMT divergence, and correlation concepts
-- Requires 100% to pass and unlocks Week 7 (Phase 8)

-- Step 1: Insert the Week 6 Exam quiz
INSERT INTO quizzes (
  title, 
  description, 
  passing_grade, 
  linked_phase_id, 
  is_active, 
  created_at, 
  updated_at
)
VALUES (
  'Week 6 Exam',
  'Advanced intermarket analysis exam covering SMT divergence concepts, correlating assets (DXY, EUR/USD, Bonds, BTC/USDT.D), Federal Reserve policy impacts on markets, bond market relationships with interest rates, open interest analysis, and COT report interpretation. Requires 100% mastery to pass.',
  100,
  '388ad791-c9ef-4671-9356-ff3d9ebddb0f',
  true,
  now(),
  now()
);

-- Step 2: Insert all 15 questions for Week 6 Exam
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
  q.id,
  'If correlating assets are not moving together, and one is creating highs when the other is not, we look at this as ________.',
  1,
  '[{"id":"1","text":"Bullish"},{"id":"2","text":"Bearish"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 6 Exam'
UNION ALL
SELECT 
  q.id,
  'If correlating assets are not moving together, and one is creating lows when the other is not, we look at this as ________.',
  2,
  '[{"id":"1","text":"Bullish"},{"id":"2","text":"Bearish"}]'::jsonb,
  '1',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 6 Exam'
UNION ALL
SELECT 
  q.id,
  'It''s best to use SMT divergence alone and without bias.',
  3,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 6 Exam'
UNION ALL
SELECT 
  q.id,
  'SMT divergence should change any previous ideas you had that go against it.',
  4,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 6 Exam'
UNION ALL
SELECT 
  q.id,
  'If the dollar is making a higher high and EUR/USD is failing to make a lower low, you would interpret the dollar as ________.',
  5,
  '[{"id":"1","text":"Strong"},{"id":"2","text":"Weak"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 6 Exam'
UNION ALL
SELECT 
  q.id,
  'Raising Fed funding rates or interest rates are considered to be bullish for the market.',
  6,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 6 Exam'
UNION ALL
SELECT 
  q.id,
  'If the bond markets are rallying, interest rates are likely to ________.',
  7,
  '[{"id":"1","text":"Remain neutral"},{"id":"2","text":"Rally"},{"id":"3","text":"Decrease"}]'::jsonb,
  '3',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 6 Exam'
UNION ALL
SELECT 
  q.id,
  'The value of the USD has no relation to bond markets.',
  8,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 6 Exam'
UNION ALL
SELECT 
  q.id,
  'BTC and USDT.D move together.',
  9,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 6 Exam'
UNION ALL
SELECT 
  q.id,
  'EUR/USD and DXY move together.',
  10,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 6 Exam'
UNION ALL
SELECT 
  q.id,
  'DXY and Bonds are inversely correlated',
  11,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '1',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 6 Exam'
UNION ALL
SELECT 
  q.id,
  'ZT1! is good for determing long term fed funding rate projections.',
  12,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 6 Exam'
UNION ALL
SELECT 
  q.id,
  'ZB is good for predicting long term fed funding rates.',
  13,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '1',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 6 Exam'
UNION ALL
SELECT 
  q.id,
  'Open interest should be used on higher time frames only.',
  14,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '1',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 6 Exam'
UNION ALL
SELECT 
  q.id,
  'COT reports are derived from the current contract in front.',
  15,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 6 Exam';

-- Step 3: Create phase requirement - Week 6 Exam must be passed to unlock Week 7 (Phase 8)
INSERT INTO phase_quiz_requirements (phase_id, quiz_id, is_required, created_at)
SELECT 
  '120f1e8d-7ede-4b50-88f6-f6e58904c66e',
  q.id,
  true,
  now()
FROM quizzes q
WHERE q.title = 'Week 6 Exam';
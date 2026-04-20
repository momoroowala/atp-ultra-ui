-- Create Week 7 Exam Quiz
-- This quiz tests advanced entry models (3x, SMM, MMEM) and timing concepts
-- Requires 100% passing grade to unlock Week 8

-- Step 1: Insert Week 7 Exam quiz
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
  'Week 7 Exam',
  'Advanced entry models exam covering the importance of bias in trading, 3x model (multi-timeframe analysis), SMM model (liquidity raids), optimal timing for capturing daily and weekly moves, MMEM model entry opportunities, and risk management with time-based models. Requires 100% mastery to pass.',
  100,
  '120f1e8d-7ede-4b50-88f6-f6e58904c66e',
  true,
  now(),
  now()
);

-- Step 2: Insert all 7 questions (all True/False format)
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
  'Bias is important for any and all entry models.',
  1,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '1',
  now(),
  now()
FROM quizzes q 
WHERE q.title = 'Week 7 Exam'
UNION ALL
SELECT 
  q.id,
  'The 3x model uses 2 timeframes only.',
  2,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q 
WHERE q.title = 'Week 7 Exam'
UNION ALL
SELECT 
  q.id,
  'The SMM model requires a raid on liquidity.',
  3,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '1',
  now(),
  now()
FROM quizzes q 
WHERE q.title = 'Week 7 Exam'
UNION ALL
SELECT 
  q.id,
  'To catch the move of the day we trade during Asia session.',
  4,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q 
WHERE q.title = 'Week 7 Exam'
UNION ALL
SELECT 
  q.id,
  'The move of the week is caught by trading on Friday.',
  5,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q 
WHERE q.title = 'Week 7 Exam'
UNION ALL
SELECT 
  q.id,
  'The MMEM model ALWAYS provides 2 entries.',
  6,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q 
WHERE q.title = 'Week 7 Exam'
UNION ALL
SELECT 
  q.id,
  'The time based models are to be used with fixed 5R.',
  7,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q 
WHERE q.title = 'Week 7 Exam';

-- Step 3: Link Week 7 Exam as requirement for Week 8 (Phase 9)
INSERT INTO phase_quiz_requirements (phase_id, quiz_id, is_required, created_at)
SELECT 
  'e9f862b0-b43f-442a-a351-9e3525b37409',
  q.id,
  true,
  now()
FROM quizzes q
WHERE q.title = 'Week 7 Exam';
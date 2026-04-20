-- Create Week 8 Exam Quiz
-- This quiz tests risk management, psychology, and mindset mastery
-- Requires 100% passing grade
-- Does NOT unlock any subsequent phase (capstone assessment)

-- Step 1: Insert Week 8 Exam quiz
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
  'Week 8 Exam',
  'Comprehensive risk management and trading psychology exam covering position sizing, risk acceptance, edge definition, psychology vs technical analysis, emotional discipline, profit-taking strategies, common trading mistakes, probabilistic thinking, mindset maintenance, journaling routines, and post-funding realities. Requires 100% mastery to pass.',
  100,
  'e9f862b0-b43f-442a-a351-9e3525b37409',
  true,
  now(),
  now()
);

-- Step 2: Insert all 15 questions (13 True/False, 2 Multiple Choice)
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
  'Risk management is _________',
  1,
  '[{"id":"1","text":"only important for newer traders"},{"id":"2","text":"just as important as technical analysis"},{"id":"3","text":"the most important part of any trading plan"}]'::jsonb,
  '3',
  now(),
  now()
FROM quizzes q 
WHERE q.title = 'Week 8 Exam'
UNION ALL
SELECT 
  q.id,
  'All positions should be sized the same.',
  2,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q 
WHERE q.title = 'Week 8 Exam'
UNION ALL
SELECT 
  q.id,
  'Your stop losses will be respected during high impact news.',
  3,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q 
WHERE q.title = 'Week 8 Exam'
UNION ALL
SELECT 
  q.id,
  'An edge in the market means that you have a good understanding of technical analysis.',
  4,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q 
WHERE q.title = 'Week 8 Exam'
UNION ALL
SELECT 
  q.id,
  'Technical analysis is more important than trading psychology.',
  5,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q 
WHERE q.title = 'Week 8 Exam'
UNION ALL
SELECT 
  q.id,
  'Understanding and accepting risk is the same thing.',
  6,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q 
WHERE q.title = 'Week 8 Exam'
UNION ALL
SELECT 
  q.id,
  'Taking profits too early is ok, because you can''t go broke taking profits.',
  7,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q 
WHERE q.title = 'Week 8 Exam'
UNION ALL
SELECT 
  q.id,
  'Which of the following is not a mistake?',
  8,
  '[{"id":"1","text":"Switching strategies due to one not working for a few days"},{"id":"2","text":"Continuing to execute your proven strategy through a losing streak"},{"id":"3","text":"Taking profits too early"},{"id":"4","text":"Closing trades before stop losses are hit"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q 
WHERE q.title = 'Week 8 Exam'
UNION ALL
SELECT 
  q.id,
  'You should move your stop loss further and increase risk at certain times.',
  9,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q 
WHERE q.title = 'Week 8 Exam'
UNION ALL
SELECT 
  q.id,
  'A successful trader can call moves with certainty.',
  10,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q 
WHERE q.title = 'Week 8 Exam'
UNION ALL
SELECT 
  q.id,
  'At a master experience level, you will be able to call the market with 100% accuracy.',
  11,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q 
WHERE q.title = 'Week 8 Exam'
UNION ALL
SELECT 
  q.id,
  'A successful trader thinks in probabilities.',
  12,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '1',
  now(),
  now()
FROM quizzes q 
WHERE q.title = 'Week 8 Exam'
UNION ALL
SELECT 
  q.id,
  'Your mindset outside of trading has no impact on your trading performance.',
  13,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q 
WHERE q.title = 'Week 8 Exam'
UNION ALL
SELECT 
  q.id,
  'Your journaling and morning routine can ease up once you are successful at trading.',
  14,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q 
WHERE q.title = 'Week 8 Exam'
UNION ALL
SELECT 
  q.id,
  'Once you get funded, everything is easy.',
  15,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q 
WHERE q.title = 'Week 8 Exam';

-- Step 3: NO phase_quiz_requirements record created
-- This is the capstone exam and does not unlock any subsequent phase
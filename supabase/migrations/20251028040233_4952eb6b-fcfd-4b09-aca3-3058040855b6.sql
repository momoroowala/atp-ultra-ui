-- Create Week 5 Exam Quiz with 100% passing grade
-- This quiz is linked to Week 5 (Phase 6) and unlocks Week 6 (Phase 7)

-- Insert the Week 5 Exam quiz
INSERT INTO quizzes (title, description, passing_grade, linked_phase_id, is_active, created_at, updated_at)
VALUES (
  'Week 5 Exam',
  'Masters-level exam covering standard deviations and state of delivery, NWOG/NDOG concepts, defined ranges of time (1/4 and 1/3 breakdowns), Power of 3 methodology, jumpstart targeting with fair value gaps, and advanced market structure setups. Requires 100% mastery to pass.',
  100,
  'de734dbd-2fa3-467c-a704-a70187a6ea8b',
  true,
  now(),
  now()
);

-- Insert all 18 questions for Week 5 Exam
INSERT INTO quiz_questions (quiz_id, question_text, question_order, answer_options, correct_answer_id, created_at, updated_at)
SELECT 
  q.id,
  'We look for a change in the state of delivery after ________.',
  1,
  '[{"id":"1","text":"1 standard deviation"},{"id":"2","text":"2 standard deviations"},{"id":"3","text":"3 standard deviations"},{"id":"4","text":"4 standard deviations"}]'::jsonb,
  '3',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 5 Exam'
UNION ALL
SELECT 
  q.id,
  'Standard deviations can be applied to time-based levels.',
  2,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '1',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 5 Exam'
UNION ALL
SELECT 
  q.id,
  'Standard deviations can be used for ________.',
  3,
  '[{"id":"1","text":"Bias"},{"id":"2","text":"Trade exits"},{"id":"3","text":"Changes in the state of delivery"},{"id":"4","text":"All of the above"}]'::jsonb,
  '4',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 5 Exam'
UNION ALL
SELECT 
  q.id,
  'Jumpstart targeting uses standard deviations of ________.',
  4,
  '[{"id":"1","text":"Order blocks"},{"id":"2","text":"Manipulation blocks"},{"id":"3","text":"Fair value gaps"},{"id":"4","text":"Market structure"}]'::jsonb,
  '3',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 5 Exam'
UNION ALL
SELECT 
  q.id,
  'The masters'' information in Week 5 can be used without the context of the first month of the program.',
  5,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 5 Exam'
UNION ALL
SELECT 
  q.id,
  'NWOG and NDOG are always created with new weeks or new days.',
  6,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 5 Exam'
UNION ALL
SELECT 
  q.id,
  'NWOG and NDOG are to be used with ________.',
  7,
  '[{"id":"1","text":"Previously monthly lows"},{"id":"2","text":"The Power of 3"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 5 Exam'
UNION ALL
SELECT 
  q.id,
  'Defined ranges of time are broken down into ________.',
  8,
  '[{"id":"1","text":"1/10 and 1/2"},{"id":"2","text":"1/4 and 1/3"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 5 Exam'
UNION ALL
SELECT 
  q.id,
  'Defined ranges of time are determined by using the daily candle open found on TradingView or your broker.',
  9,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '1',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 5 Exam'
UNION ALL
SELECT 
  q.id,
  'SGC is to be used without structure.',
  10,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 5 Exam'
UNION ALL
SELECT 
  q.id,
  'Accumulation is __________.',
  11,
  '[{"id":"1","text":"Likely to occur later in the week"},{"id":"2","text":"Setting the table for the defined range in time"},{"id":"3","text":"Bullish"},{"id":"4","text":"Bearish"}]'::jsonb,
  '3',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 5 Exam'
UNION ALL
SELECT 
  q.id,
  'The first part of the defined range is to be viewed as __________.',
  12,
  '[{"id":"1","text":"Accumulation"},{"id":"2","text":"Manipulation"},{"id":"3","text":"Distribution"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 5 Exam'
UNION ALL
SELECT 
  q.id,
  'The day is broken into _ parts.',
  13,
  '[{"id":"1","text":"4"},{"id":"2","text":"2"},{"id":"3","text":"5"},{"id":"4","text":"3"}]'::jsonb,
  '4',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 5 Exam'
UNION ALL
SELECT 
  q.id,
  'The Power of 3 is not expected in all defined ranges of time.',
  14,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '1',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 5 Exam'
UNION ALL
SELECT 
  q.id,
  'When the market shifts from manipulation to distribution, we are likely to see __________.',
  15,
  '[{"id":"1","text":"Consolidation"},{"id":"2","text":"Expansion"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 5 Exam'
UNION ALL
SELECT 
  q.id,
  'Our long-term high is made during the first tap of a fair-value gap or other footprint.',
  16,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '2',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 5 Exam'
UNION ALL
SELECT 
  q.id,
  'The 2nd intermediate high or low in an advanced market-structure setup is always turtle-souped (raided).',
  17,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '1',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 5 Exam'
UNION ALL
SELECT 
  q.id,
  'The long-term high or low is expected to be protected if an advanced structure setup is valid.',
  18,
  '[{"id":"1","text":"TRUE"},{"id":"2","text":"FALSE"}]'::jsonb,
  '1',
  now(),
  now()
FROM quizzes q WHERE q.title = 'Week 5 Exam';

-- Link Week 5 Exam to Week 6 (Phase 7) as unlock requirement
INSERT INTO phase_quiz_requirements (phase_id, quiz_id, is_required, created_at)
SELECT 
  '388ad791-c9ef-4671-9356-ff3d9ebddb0f',
  q.id,
  true,
  now()
FROM quizzes q
WHERE q.title = 'Week 5 Exam';
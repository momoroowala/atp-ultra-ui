-- Create the Week 2 Exam quiz
INSERT INTO quizzes (
  title,
  description,
  passing_grade,
  linked_phase_id,
  is_active
) VALUES (
  'Week 2 Exam',
  'Comprehensive exam covering Week 2 concepts including confluences, manipulation blocks, footprints, order blocks, liquidity voids, fair value gaps, breaker blocks, balanced ranges, and wick blocks.',
  100,
  'd43e6114-26c4-4d3b-9ee0-aed1936b9ee8',
  true
);

-- Link quiz to Phase 4 (Week 3) as unlock requirement
INSERT INTO phase_quiz_requirements (
  phase_id,
  quiz_id,
  is_required
) VALUES (
  '0efe98c4-5587-4ab0-aece-06a2ee6b7c85',
  (SELECT id FROM quizzes WHERE title = 'Week 2 Exam' ORDER BY created_at DESC LIMIT 1),
  true
);

-- Question 1: A confluence is ______
INSERT INTO quiz_questions (
  quiz_id,
  question_text,
  question_order,
  answer_options,
  correct_answer_id
) VALUES (
  (SELECT id FROM quizzes WHERE title = 'Week 2 Exam' ORDER BY created_at DESC LIMIT 1),
  'A confluence is ______',
  1,
  '[{"id":"a","text":"Something you see on the chart that goes against what you see somewhere else"},{"id":"b","text":"Something you see on the chart that is agreeing with what you see elsewhere on the chart"}]'::jsonb,
  'b'
);

-- Question 2: Is a manipulation block valid every single time that a candle closes below a low?
INSERT INTO quiz_questions (
  quiz_id,
  question_text,
  question_order,
  answer_options,
  correct_answer_id
) VALUES (
  (SELECT id FROM quizzes WHERE title = 'Week 2 Exam' ORDER BY created_at DESC LIMIT 1),
  'Is a manipulation block valid every single time that a candle closes below a low?',
  2,
  '[{"id":"a","text":"Yes"},{"id":"b","text":"No"}]'::jsonb,
  'b'
);

-- Question 3: Footprints have nothing to do with structure.
INSERT INTO quiz_questions (
  quiz_id,
  question_text,
  question_order,
  answer_options,
  correct_answer_id
) VALUES (
  (SELECT id FROM quizzes WHERE title = 'Week 2 Exam' ORDER BY created_at DESC LIMIT 1),
  'Footprints have nothing to do with structure.',
  3,
  '[{"id":"a","text":"TRUE"},{"id":"b","text":"FALSE"}]'::jsonb,
  'b'
);

-- Question 4: An order block is ______
INSERT INTO quiz_questions (
  quiz_id,
  question_text,
  question_order,
  answer_options,
  correct_answer_id
) VALUES (
  (SELECT id FROM quizzes WHERE title = 'Week 2 Exam' ORDER BY created_at DESC LIMIT 1),
  'An order block is ______',
  4,
  '[{"id":"a","text":"A range or candle where institutions and retail are trading together"},{"id":"b","text":"A range or candle where institutions will be buying or selling against the retail trend"}]'::jsonb,
  'b'
);

-- Question 5: A liquidity void and a fair value gap are the same thing when viewed on the same timeframe.
INSERT INTO quiz_questions (
  quiz_id,
  question_text,
  question_order,
  answer_options,
  correct_answer_id
) VALUES (
  (SELECT id FROM quizzes WHERE title = 'Week 2 Exam' ORDER BY created_at DESC LIMIT 1),
  'A liquidity void and a fair value gap are the same thing when viewed on the same timeframe.',
  5,
  '[{"id":"a","text":"TRUE"},{"id":"b","text":"FALSE"}]'::jsonb,
  'b'
);

-- Question 6: A fair value gap causes a gap between ______
INSERT INTO quiz_questions (
  quiz_id,
  question_text,
  question_order,
  answer_options,
  correct_answer_id
) VALUES (
  (SELECT id FROM quizzes WHERE title = 'Week 2 Exam' ORDER BY created_at DESC LIMIT 1),
  'A fair value gap causes a gap between ______',
  6,
  '[{"id":"a","text":"Wicks"},{"id":"b","text":"Bodies"}]'::jsonb,
  'b'
);

-- Question 7: Breaker blocks are involved during ______
INSERT INTO quiz_questions (
  quiz_id,
  question_text,
  question_order,
  answer_options,
  correct_answer_id
) VALUES (
  (SELECT id FROM quizzes WHERE title = 'Week 2 Exam' ORDER BY created_at DESC LIMIT 1),
  'Breaker blocks are involved during ______',
  7,
  '[{"id":"a","text":"Support and resistance re-tests"},{"id":"b","text":"Runs on liquidity"},{"id":"c","text":"Order blocks"},{"id":"d","text":"Fair value gaps"}]'::jsonb,
  'b'
);

-- Question 8: We spot a balanced range on the chart by seeing ______
INSERT INTO quiz_questions (
  quiz_id,
  question_text,
  question_order,
  answer_options,
  correct_answer_id
) VALUES (
  (SELECT id FROM quizzes WHERE title = 'Week 2 Exam' ORDER BY created_at DESC LIMIT 1),
  'We spot a balanced range on the chart by seeing ______',
  8,
  '[{"id":"a","text":"3 order blocks meet together"},{"id":"b","text":"A bullish butterfly pattern"},{"id":"c","text":"Liquidity void and order block meeting"},{"id":"d","text":"2 fair value gaps meeting"}]'::jsonb,
  'c'
);

-- Question 9: A wick block is usually made of a candle that ______
INSERT INTO quiz_questions (
  quiz_id,
  question_text,
  question_order,
  answer_options,
  correct_answer_id
) VALUES (
  (SELECT id FROM quizzes WHERE title = 'Week 2 Exam' ORDER BY created_at DESC LIMIT 1),
  'A wick block is usually made of a candle that ______',
  9,
  '[{"id":"a","text":"Doesn''t take liquidity (trade through a high or low), but has a big wick"},{"id":"b","text":"Takes liquidity and has a small wick"},{"id":"c","text":"Doesn''t take liquidity and has a big wick"},{"id":"d","text":"Takes liquidity and has a big wick"}]'::jsonb,
  'd'
);
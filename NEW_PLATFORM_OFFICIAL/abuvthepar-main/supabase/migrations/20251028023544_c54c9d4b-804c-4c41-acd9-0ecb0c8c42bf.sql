-- Create Week 1 Exam Quiz
INSERT INTO quizzes (id, title, description, linked_phase_id, passing_grade, is_active)
VALUES (
  gen_random_uuid(),
  'Week 1 Exam',
  'Complete this exam to demonstrate your understanding of Week 1 concepts and unlock Week 2.',
  'ce74f0a8-4963-434f-8a20-6d2297338637',
  80,
  true
);

-- Store the quiz_id for later use
DO $$
DECLARE
  v_quiz_id uuid;
BEGIN
  -- Get the quiz ID we just created
  SELECT id INTO v_quiz_id FROM quizzes WHERE title = 'Week 1 Exam' LIMIT 1;

  -- Insert Question 1
  INSERT INTO quiz_questions (quiz_id, question_text, question_order, answer_options, correct_answer_id)
  VALUES (
    v_quiz_id,
    'Have you eliminated all distractions that could hinder your success as a trader?',
    1,
    '[{"id": "a", "text": "Yes"}, {"id": "b", "text": "No"}]'::jsonb,
    'a'
  );

  -- Insert Question 2
  INSERT INTO quiz_questions (quiz_id, question_text, question_order, answer_options, correct_answer_id)
  VALUES (
    v_quiz_id,
    'Have you made a copy of the trader scorecard and trader dashboard/habit tracker?',
    2,
    '[{"id": "a", "text": "Yes"}, {"id": "b", "text": "No"}]'::jsonb,
    'a'
  );

  -- Insert Question 3
  INSERT INTO quiz_questions (quiz_id, question_text, question_order, answer_options, correct_answer_id, explanation)
  VALUES (
    v_quiz_id,
    'Range structure operates in context of impulse structure.',
    3,
    '[{"id": "a", "text": "True"}, {"id": "b", "text": "False"}]'::jsonb,
    'b',
    'Range structure does NOT operate in context of impulse structure. They are separate structural concepts.'
  );

  -- Insert Question 4
  INSERT INTO quiz_questions (quiz_id, question_text, question_order, answer_options, correct_answer_id)
  VALUES (
    v_quiz_id,
    'Do you commit to sending in the completed copies of your scorecard and dashboard weekly?',
    4,
    '[{"id": "a", "text": "Yes"}, {"id": "b", "text": "No"}]'::jsonb,
    'a'
  );

  -- Insert Question 5
  INSERT INTO quiz_questions (quiz_id, question_text, question_order, answer_options, correct_answer_id)
  VALUES (
    v_quiz_id,
    'Do you understand how to read a candle''s OHLC or open, high, low, close?',
    5,
    '[{"id": "a", "text": "Yes"}, {"id": "b", "text": "No"}]'::jsonb,
    'a'
  );

  -- Insert Question 6
  INSERT INTO quiz_questions (quiz_id, question_text, question_order, answer_options, correct_answer_id)
  VALUES (
    v_quiz_id,
    'Do you understand how to define a range in the market?',
    6,
    '[{"id": "a", "text": "Yes"}, {"id": "b", "text": "No"}]'::jsonb,
    'a'
  );

  -- Insert Question 7
  INSERT INTO quiz_questions (quiz_id, question_text, question_order, answer_options, correct_answer_id, explanation)
  VALUES (
    v_quiz_id,
    'You should only map structure from the top-down sometimes.',
    7,
    '[{"id": "a", "text": "True"}, {"id": "b", "text": "False"}]'::jsonb,
    'b',
    'You should ALWAYS map structure from the top-down, not just sometimes. This ensures proper context and accuracy.'
  );

  -- Insert Question 8
  INSERT INTO quiz_questions (quiz_id, question_text, question_order, answer_options, correct_answer_id, explanation)
  VALUES (
    v_quiz_id,
    '______ is required to have valid structure.',
    8,
    '[{"id": "a", "text": "OHLC"}, {"id": "b", "text": "Ranges"}, {"id": "c", "text": "Displacement"}, {"id": "d", "text": "Manipulation"}]'::jsonb,
    'c',
    'Displacement is required to have valid structure in the market.'
  );

  -- Link quiz to Phase 2 (Week 1) as required
  INSERT INTO phase_quiz_requirements (phase_id, quiz_id, is_required)
  VALUES (
    'ce74f0a8-4963-434f-8a20-6d2297338637',
    v_quiz_id,
    true
  );

  -- Update Phase 3 (Week 2) to unlock after Phase 2 completion
  UPDATE phases
  SET 
    unlock_type = 'completion',
    unlock_condition = jsonb_build_object('phase_id', 'ce74f0a8-4963-434f-8a20-6d2297338637')
  WHERE id = 'd43e6114-26c4-4d3b-9ee0-aed1936b9ee8';
END $$;
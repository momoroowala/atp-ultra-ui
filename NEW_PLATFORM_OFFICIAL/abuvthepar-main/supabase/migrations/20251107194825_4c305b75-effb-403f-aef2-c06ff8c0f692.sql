-- Add course_id to quizzes table to link quizzes to specific courses
ALTER TABLE quizzes 
ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_quizzes_course_id ON quizzes(course_id);

-- Update existing quizzes to link to their course via the linked_phase
UPDATE quizzes q
SET course_id = p.course_id
FROM phases p
WHERE q.linked_phase_id = p.id AND q.course_id IS NULL;
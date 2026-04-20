-- Add new linked_phase_id column to quizzes table for single phase reference
ALTER TABLE quizzes 
ADD COLUMN linked_phase_id UUID REFERENCES phases(id) ON DELETE SET NULL;

-- Migrate existing data from linked_phase_ids array to linked_phase_id
-- Take the first element of the array if it exists
UPDATE quizzes 
SET linked_phase_id = linked_phase_ids[1]
WHERE linked_phase_ids IS NOT NULL AND array_length(linked_phase_ids, 1) > 0;

-- Add comment to explain the column
COMMENT ON COLUMN quizzes.linked_phase_id IS 'Single phase this quiz is associated with/tests knowledge from';
COMMENT ON COLUMN quizzes.linked_phase_ids IS 'Deprecated: Use linked_phase_id instead. Kept for backward compatibility.';
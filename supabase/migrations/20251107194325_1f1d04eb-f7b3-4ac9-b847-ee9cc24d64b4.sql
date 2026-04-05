-- Add quiz_order column to quizzes table for ordering multiple quizzes after the same phase
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS quiz_order INTEGER DEFAULT 0;

-- Update existing quizzes to have a default order
UPDATE quizzes SET quiz_order = 0 WHERE quiz_order IS NULL;

-- Make linked_phase_id non-nullable (after ensuring all existing quizzes have a value)
-- First, update any null values to the first phase if they exist
UPDATE quizzes 
SET linked_phase_id = (
  SELECT id FROM phases 
  WHERE is_active = true 
  ORDER BY phase_order ASC 
  LIMIT 1
)
WHERE linked_phase_id IS NULL;

-- Now make the column non-nullable
ALTER TABLE quizzes 
ALTER COLUMN linked_phase_id SET NOT NULL;

-- Create function to handle phase deletion cascade for quizzes
CREATE OR REPLACE FUNCTION handle_phase_deletion_quiz_cascade()
RETURNS TRIGGER AS $$
DECLARE
  prev_phase_id UUID;
BEGIN
  -- Find the previous phase by phase_order
  SELECT id INTO prev_phase_id 
  FROM phases 
  WHERE course_id = OLD.course_id 
    AND phase_order < OLD.phase_order 
    AND is_active = true
  ORDER BY phase_order DESC 
  LIMIT 1;
  
  -- Update quizzes that were linked to the deleted phase
  IF prev_phase_id IS NOT NULL THEN
    UPDATE quizzes 
    SET linked_phase_id = prev_phase_id 
    WHERE linked_phase_id = OLD.id;
  ELSE
    -- If no previous phase exists (was first phase), 
    -- link to the new first phase
    SELECT id INTO prev_phase_id 
    FROM phases 
    WHERE course_id = OLD.course_id 
      AND is_active = true
      AND id != OLD.id
    ORDER BY phase_order ASC 
    LIMIT 1;
    
    IF prev_phase_id IS NOT NULL THEN
      UPDATE quizzes 
      SET linked_phase_id = prev_phase_id 
      WHERE linked_phase_id = OLD.id;
    ELSE
      -- If no phases remain, delete the orphaned quizzes
      DELETE FROM quizzes WHERE linked_phase_id = OLD.id;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for phase deletion
DROP TRIGGER IF EXISTS on_phase_delete_cascade_quizzes ON phases;
CREATE TRIGGER on_phase_delete_cascade_quizzes
BEFORE DELETE ON phases
FOR EACH ROW
EXECUTE FUNCTION handle_phase_deletion_quiz_cascade();
-- Step 1: Create function to sync phase visibility with course
CREATE OR REPLACE FUNCTION sync_phase_visibility()
RETURNS TRIGGER AS $$
BEGIN
  -- When course visibility changes, update all its phases
  UPDATE phases 
  SET visible_tier_ids = NEW.visible_tier_ids
  WHERE course_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 2: Create function to sync task visibility with course (via phase)
CREATE OR REPLACE FUNCTION sync_task_visibility()
RETURNS TRIGGER AS $$
BEGIN
  -- When phase is created or updated, sync tasks with course visibility
  UPDATE tasks t
  SET visible_tier_ids = c.visible_tier_ids
  FROM phases p
  JOIN courses c ON p.course_id = c.id
  WHERE t.phase_id = NEW.id
  AND p.id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 3: Create trigger on courses to sync phases when course visibility changes
DROP TRIGGER IF EXISTS trigger_sync_phase_visibility ON courses;
CREATE TRIGGER trigger_sync_phase_visibility
AFTER UPDATE OF visible_tier_ids ON courses
FOR EACH ROW
EXECUTE FUNCTION sync_phase_visibility();

-- Step 4: Create trigger on phases to sync tasks when phase is created or updated
DROP TRIGGER IF EXISTS trigger_sync_task_visibility ON phases;
CREATE TRIGGER trigger_sync_task_visibility
AFTER INSERT OR UPDATE OF course_id ON phases
FOR EACH ROW
EXECUTE FUNCTION sync_task_visibility();

-- Step 5: Update RLS policy for phases to use course access check
DROP POLICY IF EXISTS "Users can view all active phases for accessible courses" ON phases;
CREATE POLICY "Users can view phases from accessible courses"
ON phases FOR SELECT
USING (
  is_active = true 
  AND has_course_access(auth.uid(), course_id)
);

-- Step 6: Update RLS policy for tasks to check course access through phase
DROP POLICY IF EXISTS "Users can view unlocked tasks based on tier" ON tasks;
CREATE POLICY "Users can view tasks from accessible courses"
ON tasks FOR SELECT
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM phases p
    WHERE p.id = tasks.phase_id
    AND has_course_access(auth.uid(), p.course_id)
  )
  AND is_task_unlocked(id, auth.uid())
);

-- Step 7: Initial data sync - update all existing phases with their course visibility
UPDATE phases p
SET visible_tier_ids = c.visible_tier_ids
FROM courses c
WHERE p.course_id = c.id;

-- Step 8: Initial data sync - update all existing tasks with their course visibility
UPDATE tasks t
SET visible_tier_ids = c.visible_tier_ids
FROM phases p
JOIN courses c ON p.course_id = c.id
WHERE t.phase_id = p.id;
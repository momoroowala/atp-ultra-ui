-- Delete all data associated with inactive phases and tasks

-- Step 1: Delete task responses for tasks in inactive phases
DELETE FROM task_responses
WHERE task_id IN (
  SELECT id FROM tasks WHERE phase_id IN (
    SELECT id FROM phases WHERE is_active = false
  )
);

-- Step 2: Delete task responses for inactive tasks
DELETE FROM task_responses
WHERE task_id IN (
  SELECT id FROM tasks WHERE is_active = false
);

-- Step 3: Delete discipline task sections for tasks in inactive phases
DELETE FROM discipline_task_sections
WHERE task_id IN (
  SELECT id FROM tasks WHERE phase_id IN (
    SELECT id FROM phases WHERE is_active = false
  )
);

-- Step 4: Delete discipline task sections for inactive tasks
DELETE FROM discipline_task_sections
WHERE task_id IN (
  SELECT id FROM tasks WHERE is_active = false
);

-- Step 5: Delete discipline task form fields for tasks in inactive phases
DELETE FROM discipline_task_form_fields
WHERE task_id IN (
  SELECT id FROM tasks WHERE phase_id IN (
    SELECT id FROM phases WHERE is_active = false
  )
);

-- Step 6: Delete discipline task form fields for inactive tasks
DELETE FROM discipline_task_form_fields
WHERE task_id IN (
  SELECT id FROM tasks WHERE is_active = false
);

-- Step 7: Delete user task submissions for tasks in inactive phases
DELETE FROM user_task_submissions
WHERE task_id IN (
  SELECT id FROM tasks WHERE phase_id IN (
    SELECT id FROM phases WHERE is_active = false
  )
);

-- Step 8: Delete user task submissions for inactive tasks
DELETE FROM user_task_submissions
WHERE task_id IN (
  SELECT id FROM tasks WHERE is_active = false
);

-- Step 9: Delete all tasks in inactive phases
DELETE FROM tasks
WHERE phase_id IN (
  SELECT id FROM phases WHERE is_active = false
);

-- Step 10: Delete all inactive tasks
DELETE FROM tasks
WHERE is_active = false;

-- Step 11: Delete all inactive phases
DELETE FROM phases
WHERE is_active = false;
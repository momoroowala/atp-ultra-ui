-- Delete phase 1 and test task to start fresh

-- Step 1: Delete task responses for the test task
DELETE FROM task_responses
WHERE task_id = 'd8b5557f-7b67-4f8e-b566-653d250540d9';

-- Step 2: Delete user task submissions for the test task
DELETE FROM user_task_submissions
WHERE task_id = 'd8b5557f-7b67-4f8e-b566-653d250540d9';

-- Step 3: Delete discipline task sections for the test task
DELETE FROM discipline_task_sections
WHERE task_id = 'd8b5557f-7b67-4f8e-b566-653d250540d9';

-- Step 4: Delete discipline task form fields for the test task
DELETE FROM discipline_task_form_fields
WHERE task_id = 'd8b5557f-7b67-4f8e-b566-653d250540d9';

-- Step 5: Delete the test task
DELETE FROM tasks
WHERE id = 'd8b5557f-7b67-4f8e-b566-653d250540d9';

-- Step 6: Delete phase 1
DELETE FROM phases
WHERE id = 'fe259881-49f5-4886-97a3-91d009652a99';
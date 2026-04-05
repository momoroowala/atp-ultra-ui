-- Add 'url' and 'upload' to the allowed field types for discipline_task_form_fields

-- Drop the existing check constraint
ALTER TABLE discipline_task_form_fields 
DROP CONSTRAINT IF EXISTS discipline_task_form_fields_field_type_check;

-- Add new check constraint with 'url' and 'upload' included
ALTER TABLE discipline_task_form_fields 
ADD CONSTRAINT discipline_task_form_fields_field_type_check 
CHECK (field_type IN (
  'text',
  'textarea', 
  'select',
  'radio',
  'checkbox',
  'email',
  'number',
  'date',
  'file',
  'url',
  'upload'
));
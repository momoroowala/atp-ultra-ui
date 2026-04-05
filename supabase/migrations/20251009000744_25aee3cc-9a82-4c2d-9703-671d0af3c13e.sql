-- Phase 1: Database Schema Enhancements for Discipline Plan

-- 1.1 Add missing columns to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS due_date_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS due_date_start_type text DEFAULT 'join_date',
ADD COLUMN IF NOT EXISTS due_date_start_phase_id uuid REFERENCES phases(id),
ADD COLUMN IF NOT EXISTS due_date_days integer DEFAULT 7,
ADD COLUMN IF NOT EXISTS task_description text,
ADD COLUMN IF NOT EXISTS visibility_condition_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS visibility_condition_field_id uuid,
ADD COLUMN IF NOT EXISTS visibility_condition_value text,
ADD COLUMN IF NOT EXISTS visibility_conditions jsonb;

-- 1.2 Add missing columns to phases table
ALTER TABLE phases 
ADD COLUMN IF NOT EXISTS order_index integer,
ADD COLUMN IF NOT EXISTS unlock_delay_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS required_phase_id uuid REFERENCES phases(id),
ADD COLUMN IF NOT EXISTS requires_previous_completion boolean DEFAULT false;

-- Copy phase_order to order_index if not already done
UPDATE phases SET order_index = phase_order WHERE order_index IS NULL;

-- 1.3 Create task sections table
CREATE TABLE IF NOT EXISTS discipline_task_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  section_type text NOT NULL CHECK (section_type IN ('video', 'readout', 'form')),
  title text,
  data jsonb,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1.4 Create form fields table
CREATE TABLE IF NOT EXISTS discipline_task_form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  order_index integer NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text', 'textarea', 'select', 'radio', 'checkbox', 'email', 'number', 'date', 'file')),
  label text NOT NULL,
  name text NOT NULL,
  required boolean DEFAULT false,
  placeholder text,
  help_text text,
  options text[] DEFAULT '{}',
  default_value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1.5 Create user task submissions table
CREATE TABLE IF NOT EXISTS user_task_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, task_id)
);

-- 1.6 Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_sections_task_id ON discipline_task_sections(task_id);
CREATE INDEX IF NOT EXISTS idx_task_sections_order ON discipline_task_sections(task_id, order_index);
CREATE INDEX IF NOT EXISTS idx_form_fields_task_id ON discipline_task_form_fields(task_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_order ON discipline_task_form_fields(task_id, order_index);
CREATE INDEX IF NOT EXISTS idx_submissions_user_task ON user_task_submissions(user_id, task_id);

-- 1.7 Enable RLS on new tables
ALTER TABLE discipline_task_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipline_task_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_task_submissions ENABLE ROW LEVEL SECURITY;

-- 1.8 Create RLS policies for task sections
CREATE POLICY "Admins can manage task sections"
ON discipline_task_sections FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view task sections"
ON discipline_task_sections FOR SELECT
USING (true);

-- 1.9 Create RLS policies for form fields
CREATE POLICY "Admins can manage form fields"
ON discipline_task_form_fields FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view form fields"
ON discipline_task_form_fields FOR SELECT
USING (true);

-- 1.10 Create RLS policies for submissions
CREATE POLICY "Users manage own submissions"
ON user_task_submissions FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all submissions"
ON user_task_submissions FOR SELECT
USING (is_admin(auth.uid()));

-- 1.11 Create trigger for updated_at
CREATE TRIGGER update_task_sections_updated_at
BEFORE UPDATE ON discipline_task_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_form_fields_updated_at
BEFORE UPDATE ON discipline_task_form_fields
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
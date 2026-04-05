
-- =============================================
-- 30 Day Sprint: Data Layer Migration
-- Creates sprint_phases, sprint_tasks, sprint_task_modules
-- Migrates existing sprint_task_completions to use task_id
-- =============================================

-- 1. Create sprint_phases table
CREATE TABLE public.sprint_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  day_start integer NOT NULL,
  day_end integer NOT NULL,
  goal_text text,
  completion_banner_text text,
  sort_order integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Create sprint_tasks table
CREATE TABLE public.sprint_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid NOT NULL REFERENCES public.sprint_phases(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  title text NOT NULL,
  sort_order integer NOT NULL,
  is_checkpoint boolean DEFAULT false,
  is_final boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 3. Create sprint_task_modules table
CREATE TABLE public.sprint_task_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.sprint_tasks(id) ON DELETE CASCADE,
  module_name text NOT NULL,
  sort_order integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 4. Enable RLS on new tables
ALTER TABLE public.sprint_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_task_modules ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can read all sprint content
CREATE POLICY "Authenticated users can read sprint phases"
  ON public.sprint_phases FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read sprint tasks"
  ON public.sprint_tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read sprint task modules"
  ON public.sprint_task_modules FOR SELECT TO authenticated USING (true);

-- 5. Add task_id column to existing sprint_task_completions
ALTER TABLE public.sprint_task_completions
  ADD COLUMN IF NOT EXISTS task_id uuid REFERENCES public.sprint_tasks(id) ON DELETE CASCADE;

-- 6. Seed all data using DO block to capture UUIDs
DO $$
DECLARE
  phase1_id uuid;
  phase2_id uuid;
  phase3_id uuid;
  t_id uuid;
BEGIN
  -- Insert phases
  INSERT INTO public.sprint_phases (title, day_start, day_end, goal_text, completion_banner_text, sort_order)
  VALUES ('FOUNDATION & SETUP', 1, 7, 'Get your business legally established and Amazon account active', '🎉 PHASE 1 COMPLETE! Foundation Built — LLC, Seller Central, and Tools Ready!', 1)
  RETURNING id INTO phase1_id;

  INSERT INTO public.sprint_phases (title, day_start, day_end, goal_text, completion_banner_text, sort_order)
  VALUES ('LEARNING & MARKET RESEARCH', 8, 17, 'Master the wholesale model and build your 100+ lead list', '🎉 PHASE 2 COMPLETE! 100+ Leads Built and Ready for Outreach!', 2)
  RETURNING id INTO phase2_id;

  INSERT INTO public.sprint_phases (title, day_start, day_end, goal_text, completion_banner_text, sort_order)
  VALUES ('OUTREACH & ACCOUNT OPENING', 18, 30, 'Open 5+ supplier/brand accounts and prepare for ordering', '🏆 30-DAY SPRINT COMPLETE! You''re ready to place your first wholesale order!', 3)
  RETURNING id INTO phase3_id;

  -- Phase 1 tasks (Days 1-7)
  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase1_id, 1, 'Watch Course Overview & Set Your Goals', 1) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Welcome', 1);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase1_id, 2, 'Research & Start LLC Formation (Bizee.com)', 2) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 1 — How to Get Setup', 1);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase1_id, 3, 'Apply for EIN (Employer Identification Number)', 3) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 1 — How to Get Setup', 1);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase1_id, 4, 'Set Up Business Email & Banking', 4) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 1 — How to Get Setup', 1);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase1_id, 5, 'Create Amazon Seller Central Account (Part 1)', 5) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 1 — How to Get Setup', 1);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase1_id, 6, 'Complete Seller Central Application (Part 2)', 6) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 1 — How to Get Setup', 1);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase1_id, 7, 'Install Essential Tools (Smartscout, Keepa, Gmass)', 7) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 1 — How to Get Setup', 1);

  -- Phase 2 tasks (Days 8-17)
  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase2_id, 8, 'Complete Module 2: Amazon Marketplace Basics', 1) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 2 — Marketplace Basics', 1);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase2_id, 9, 'Master Smartscout for Brand Discovery', 2) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 4 — Sourcing Suppliers', 1);
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 3 — Sourcing Brands', 2);
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 5 — Sourcing Products', 3);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase2_id, 10, 'Learn Product Research Fundamentals', 3) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 5 — Sourcing Products', 1);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase2_id, 11, 'Set Up Lead List Spreadsheet', 4) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 3 — Sourcing Brands', 1);
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 4 — Sourcing Suppliers', 2);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase2_id, 12, 'Learn Lead Generation Strategies', 5) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 3 — Sourcing Brands', 1);
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 4 — Sourcing Suppliers', 2);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase2_id, 13, 'Build Lead List: Add 20 Brands/Suppliers (20 Total)', 6) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 3 — Sourcing Brands', 1);
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 4 — Sourcing Suppliers', 2);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase2_id, 14, 'Build Lead List: Add 20 Brands/Suppliers (40 Total)', 7) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 3 — Sourcing Brands', 1);
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 4 — Sourcing Suppliers', 2);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase2_id, 15, 'Build Lead List: Add 20 Brands/Suppliers (60 Total)', 8) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 3 — Sourcing Brands', 1);
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 4 — Sourcing Suppliers', 2);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase2_id, 16, 'Build Lead List: Add 20 Brands/Suppliers (80 Total)', 9) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 3 — Sourcing Brands', 1);
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 4 — Sourcing Suppliers', 2);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order, is_checkpoint) VALUES (phase2_id, 17, 'Build Lead List: Add 20 Brands/Suppliers (100 Total!) + CHECKPOINT', 10, true) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 3 — Sourcing Brands', 1);
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 4 — Sourcing Suppliers', 2);

  -- Phase 3 tasks (Days 18-30)
  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase3_id, 18, 'Set Up Gmass & Prepare Outreach Templates', 1) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 4 — Sourcing Suppliers', 1);
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 5 — Sourcing Products', 2);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase3_id, 19, 'Send First 50 Outreach Emails via Gmass', 2) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 4 — Sourcing Suppliers', 1);
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 5 — Sourcing Products', 2);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase3_id, 20, 'Send Second 50 Outreach Emails (100 Total!)', 3) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 4 — Sourcing Suppliers', 1);
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 5 — Sourcing Products', 2);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase3_id, 21, 'Review Responses & Reply to Interested Brands', 4) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 4 — Sourcing Suppliers', 1);
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 5 — Sourcing Products', 2);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase3_id, 22, 'Complete Wholesale Applications (5+ Brands)', 5) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 4 — Sourcing Suppliers', 1);
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 5 — Sourcing Products', 2);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase3_id, 23, 'Follow Up on Pending Applications', 6) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 4 — Sourcing Suppliers', 1);
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 5 — Sourcing Products', 2);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase3_id, 24, 'Continue Applications & Follow-Ups', 7) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 4 — Sourcing Suppliers', 1);
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 5 — Sourcing Products', 2);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase3_id, 25, 'Request Pricelists from Approved Suppliers', 8) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 4 — Sourcing Suppliers', 1);
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 5 — Sourcing Products', 2);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase3_id, 26, 'Analyze Pricelists & Select Products', 9) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 4 — Sourcing Suppliers', 1);
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 5 — Sourcing Products', 2);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase3_id, 27, 'Finalize Account Details with Suppliers', 10) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 4 — Sourcing Suppliers', 1);
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 5 — Sourcing Products', 2);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase3_id, 28, 'Confirm Payment Terms & MOQs', 11) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 4 — Sourcing Suppliers', 1);
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 5 — Sourcing Products', 2);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order) VALUES (phase3_id, 29, 'Verify 5+ Accounts Opened & Document Details', 12) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 4 — Sourcing Suppliers', 1);
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 5 — Sourcing Products', 2);

  INSERT INTO public.sprint_tasks (phase_id, day_number, title, sort_order, is_final) VALUES (phase3_id, 30, 'Review Sprint Success & Plan Next Steps', 13, true) RETURNING id INTO t_id;
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 4 — Sourcing Suppliers', 1);
  INSERT INTO public.sprint_task_modules (task_id, module_name, sort_order) VALUES (t_id, 'Module 5 — Sourcing Products', 2);

  -- 7. Migrate existing completion data: match task_day to sprint_tasks.day_number
  UPDATE public.sprint_task_completions stc
  SET task_id = st.id
  FROM public.sprint_tasks st
  WHERE stc.task_day = st.day_number
    AND stc.task_id IS NULL;

END $$;

-- 8. Add unique constraint on (user_id, task_id) for upsert pattern
CREATE UNIQUE INDEX IF NOT EXISTS sprint_task_completions_user_task_unique
  ON public.sprint_task_completions (user_id, task_id)
  WHERE task_id IS NOT NULL;

-- 9. Add RLS policy for completions using task_id (if not already covered)
-- The existing table already has RLS enabled; add policies for task_id-based access
CREATE POLICY "Users can select own sprint completions by task_id"
  ON public.sprint_task_completions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sprint completions by task_id"
  ON public.sprint_task_completions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sprint completions by task_id"
  ON public.sprint_task_completions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

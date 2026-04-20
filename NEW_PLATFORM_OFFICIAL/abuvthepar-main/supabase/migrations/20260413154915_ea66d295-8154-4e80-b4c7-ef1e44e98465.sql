
-- ============================================================
-- 1. ENABLE RLS ON 3 UNPROTECTED TABLES
-- ============================================================

ALTER TABLE public.atp_churn_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can select churn history"
  ON public.atp_churn_history FOR SELECT
  TO authenticated
  USING (is_staff(auth.uid()));

ALTER TABLE public.arc_user_ai_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can select AI interactions"
  ON public.arc_user_ai_interactions FOR SELECT
  TO authenticated
  USING (is_staff(auth.uid()));
CREATE POLICY "Staff can insert AI interactions"
  ON public.arc_user_ai_interactions FOR INSERT
  TO authenticated
  WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff can update AI interactions"
  ON public.arc_user_ai_interactions FOR UPDATE
  TO authenticated
  USING (is_staff(auth.uid()));

ALTER TABLE public.chat_atp_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can select ATP sessions"
  ON public.chat_atp_sessions FOR SELECT
  TO authenticated
  USING (is_staff(auth.uid()));
CREATE POLICY "Staff can manage ATP sessions"
  ON public.chat_atp_sessions FOR ALL
  TO authenticated
  USING (is_staff(auth.uid()))
  WITH CHECK (is_staff(auth.uid()));

-- ============================================================
-- 2. FIX OVERLY PERMISSIVE RLS POLICIES
-- ============================================================

-- user_login_streaks: replace USING(true) ALL policy
DROP POLICY IF EXISTS "System can manage login streaks" ON public.user_login_streaks;
CREATE POLICY "Users can manage own streaks"
  ON public.user_login_streaks FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- user_milestones: replace USING(true) ALL policy
DROP POLICY IF EXISTS "System can manage milestones" ON public.user_milestones;
CREATE POLICY "Users can manage own milestones"
  ON public.user_milestones FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- prompt_catalog: replace USING(true) ALL policy
DROP POLICY IF EXISTS "admin manage prompts" ON public.prompt_catalog;
CREATE POLICY "Staff can manage prompts"
  ON public.prompt_catalog FOR ALL
  TO authenticated
  USING (is_staff(auth.uid()))
  WITH CHECK (is_staff(auth.uid()));

-- impersonation_audit_log: restrict INSERT to staff
DROP POLICY IF EXISTS "Anyone can insert audit log" ON public.impersonation_audit_log;
DROP POLICY IF EXISTS "Staff can insert" ON public.impersonation_audit_log;
-- Find and drop any INSERT policy with WITH CHECK(true)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'impersonation_audit_log' AND schemaname = 'public' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.impersonation_audit_log', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "Staff can insert audit log"
  ON public.impersonation_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (is_staff(auth.uid()));

-- support_notifications: restrict INSERT
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.support_notifications;
DROP POLICY IF EXISTS "Anyone can insert" ON public.support_notifications;
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'support_notifications' AND schemaname = 'public' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.support_notifications', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "Users or staff can insert notifications"
  ON public.support_notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR is_staff(auth.uid()));

-- user_achievement_badges: restrict INSERT
DROP POLICY IF EXISTS "System can insert badges" ON public.user_achievement_badges;
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'user_achievement_badges' AND schemaname = 'public' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_achievement_badges', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "Users can insert own badges"
  ON public.user_achievement_badges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- user_points: restrict INSERT
DROP POLICY IF EXISTS "System can insert points" ON public.user_points;
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'user_points' AND schemaname = 'public' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_points', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "Users can insert own points"
  ON public.user_points FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- support_tickets: restrict INSERT to own tickets
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'support_tickets' AND schemaname = 'public' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.support_tickets', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "Users can create own tickets"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = submitter_user_id);

-- community_dm_conversations: tighten INSERT (already safe, just explicit)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'community_dm_conversations' AND schemaname = 'public' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.community_dm_conversations', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "Authenticated users can create DM conversations"
  ON public.community_dm_conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- 3. FIX STORAGE POLICIES
-- ============================================================

-- Avatars: tighten DELETE/UPDATE to own files
DROP POLICY IF EXISTS "Users can delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update avatars" ON storage.objects;

-- Find and drop avatar DELETE/UPDATE policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND (cmd = 'DELETE' OR cmd = 'UPDATE')
      AND policyname ILIKE '%avatar%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Ticket attachments: restrict SELECT to ticket owner or staff
-- First drop existing overly permissive SELECT policy
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND cmd = 'SELECT'
      AND policyname ILIKE '%ticket%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Ticket attachment owners or staff can view"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'ticket-attachments'
    AND (
      is_staff(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.support_tickets st
        WHERE st.id::text = (storage.foldername(name))[1]
          AND st.submitter_user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- 4. FIX SECURITY DEFINER VIEW
-- ============================================================

-- Recreate the view with security_invoker
DO $$
DECLARE
  view_def TEXT;
BEGIN
  SELECT pg_get_viewdef('public.user_churn_risk_segments', true) INTO view_def;
  EXECUTE 'DROP VIEW IF EXISTS public.user_churn_risk_segments CASCADE';
  EXECUTE 'CREATE VIEW public.user_churn_risk_segments AS ' || view_def;
  EXECUTE 'ALTER VIEW public.user_churn_risk_segments SET (security_invoker = true)';
END $$;

-- ============================================================
-- 5. FIX MUTABLE SEARCH_PATH ON 2 FUNCTIONS
-- ============================================================

-- Fix atp_take_churn_segment_snapshot
ALTER FUNCTION public.atp_take_churn_segment_snapshot() SET search_path = 'public';

-- Fix atp_ab_test_results
ALTER FUNCTION public.atp_ab_test_results() SET search_path = 'public';

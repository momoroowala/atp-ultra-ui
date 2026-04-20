-- Fix DM participants RLS recursion + add missing policies + set function search_path

-- 1) SECURITY DEFINER helper for DM participant checks
CREATE OR REPLACE FUNCTION public.is_dm_conversation_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.community_dm_participants
    WHERE user_id = _user_id
      AND conversation_id = _conversation_id
  )
$$;

DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.community_dm_participants;

CREATE POLICY "Users can view participants in their conversations"
ON public.community_dm_participants
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_dm_conversation_participant(auth.uid(), conversation_id)
);

-- 2) RLS enabled but no policy: create minimal, secure policies

-- trading_metrics_cache
DROP POLICY IF EXISTS "Users can view own trading metrics cache" ON public.trading_metrics_cache;
CREATE POLICY "Users can view own trading metrics cache"
ON public.trading_metrics_cache
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own trading metrics cache" ON public.trading_metrics_cache;
CREATE POLICY "Users can manage own trading metrics cache"
ON public.trading_metrics_cache
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage trading metrics cache" ON public.trading_metrics_cache;
CREATE POLICY "Admins can manage trading metrics cache"
ON public.trading_metrics_cache
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- upsell_funnels
DROP POLICY IF EXISTS "Authenticated users can view upsell funnels" ON public.upsell_funnels;
CREATE POLICY "Authenticated users can view upsell funnels"
ON public.upsell_funnels
FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage upsell funnels" ON public.upsell_funnels;
CREATE POLICY "Admins can manage upsell funnels"
ON public.upsell_funnels
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- user_ai_interactions (PII / content)
DROP POLICY IF EXISTS "Users can view own ai interactions" ON public.user_ai_interactions;
CREATE POLICY "Users can view own ai interactions"
ON public.user_ai_interactions
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own ai interactions" ON public.user_ai_interactions;
CREATE POLICY "Users can manage own ai interactions"
ON public.user_ai_interactions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view ai interactions" ON public.user_ai_interactions;
CREATE POLICY "Admins can view ai interactions"
ON public.user_ai_interactions
FOR SELECT
USING (public.is_admin(auth.uid()));

-- user_badges
DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
CREATE POLICY "Users can view own badges"
ON public.user_badges
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage user badges" ON public.user_badges;
CREATE POLICY "Admins can manage user badges"
ON public.user_badges
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- user_homework_progress
DROP POLICY IF EXISTS "Users can view own homework progress" ON public.user_homework_progress;
CREATE POLICY "Users can view own homework progress"
ON public.user_homework_progress
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own homework progress" ON public.user_homework_progress;
CREATE POLICY "Users can manage own homework progress"
ON public.user_homework_progress
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all homework progress" ON public.user_homework_progress;
CREATE POLICY "Admins can view all homework progress"
ON public.user_homework_progress
FOR SELECT
USING (public.is_admin(auth.uid()));

-- user_review_assignments
DROP POLICY IF EXISTS "Users can view own review assignments" ON public.user_review_assignments;
CREATE POLICY "Users can view own review assignments"
ON public.user_review_assignments
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage review assignments" ON public.user_review_assignments;
CREATE POLICY "Admins can manage review assignments"
ON public.user_review_assignments
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- user_task_submissions
DROP POLICY IF EXISTS "Users can view own task submissions" ON public.user_task_submissions;
CREATE POLICY "Users can view own task submissions"
ON public.user_task_submissions
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own task submissions" ON public.user_task_submissions;
CREATE POLICY "Users can insert own task submissions"
ON public.user_task_submissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own task submissions" ON public.user_task_submissions;
CREATE POLICY "Users can update own task submissions"
ON public.user_task_submissions
FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage task submissions" ON public.user_task_submissions;
CREATE POLICY "Admins can manage task submissions"
ON public.user_task_submissions
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 3) Fix function search_path mutable
CREATE OR REPLACE FUNCTION public.handle_phase_deletion_quiz_cascade()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  prev_phase_id UUID;
BEGIN
  SELECT id INTO prev_phase_id 
  FROM phases 
  WHERE course_id = OLD.course_id 
    AND phase_order < OLD.phase_order 
    AND is_active = true
  ORDER BY phase_order DESC 
  LIMIT 1;

  IF prev_phase_id IS NOT NULL THEN
    UPDATE quizzes 
    SET linked_phase_id = prev_phase_id 
    WHERE linked_phase_id = OLD.id;
  ELSE
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
      DELETE FROM quizzes WHERE linked_phase_id = OLD.id;
    END IF;
  END IF;

  RETURN OLD;
END;
$function$;

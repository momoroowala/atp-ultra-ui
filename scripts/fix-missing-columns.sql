-- ============================================================================
-- ATP Ultra: Fix Missing Columns & Tables
-- Run this in your Supabase SQL Editor (sfaqexmajpfllctqubbt)
-- ============================================================================

-- 1. Add page_visibility JSONB column to roles and tiers
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS page_visibility JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.tiers ADD COLUMN IF NOT EXISTS page_visibility JSONB DEFAULT '{}'::jsonb;

-- 2. Populate page_visibility for each role
UPDATE public.roles SET page_visibility = '{
  "home": true, "courses": true, "my_plan": true, "calendar": true,
  "community": true, "one_on_ones": true, "support": true,
  "admin_panel": true, "support_tickets": true, "csm_panel": true,
  "brand_leads": true, "my_notes": true
}'::jsonb WHERE role_key = 'mega_admin';

UPDATE public.roles SET page_visibility = '{
  "home": true, "courses": true, "my_plan": true, "calendar": true,
  "community": true, "one_on_ones": true, "support": true,
  "admin_panel": true, "support_tickets": true, "csm_panel": true,
  "brand_leads": true, "my_notes": true
}'::jsonb WHERE role_key = 'admin';

UPDATE public.roles SET page_visibility = '{
  "home": true, "courses": true, "my_plan": true, "calendar": true,
  "community": true, "one_on_ones": true, "support": true,
  "admin_panel": false, "support_tickets": true, "csm_panel": true,
  "brand_leads": true, "my_notes": true
}'::jsonb WHERE role_key = 'csm';

UPDATE public.roles SET page_visibility = '{
  "home": true, "courses": true, "my_plan": true, "calendar": true,
  "community": true, "one_on_ones": true, "support": true,
  "admin_panel": false, "support_tickets": false, "csm_panel": false,
  "brand_leads": true, "my_notes": true
}'::jsonb WHERE role_key = 'executive';

UPDATE public.roles SET page_visibility = '{
  "home": true, "courses": true, "my_plan": true, "calendar": true,
  "community": true, "one_on_ones": false, "support": true,
  "admin_panel": false, "support_tickets": false, "csm_panel": false,
  "brand_leads": true, "my_notes": true
}'::jsonb WHERE role_key = 'user';

-- 3. Populate page_visibility for tiers (all tiers get base student pages)
UPDATE public.tiers SET page_visibility = '{
  "home": true, "courses": true, "my_plan": true, "calendar": true,
  "community": true, "one_on_ones": false, "support": true,
  "admin_panel": false, "support_tickets": false, "csm_panel": false,
  "brand_leads": true, "my_notes": true
}'::jsonb WHERE page_visibility = '{}'::jsonb OR page_visibility IS NULL;

-- 4. Create missing tables needed by the app

-- Sprint system
CREATE TABLE IF NOT EXISTS public.sprint_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  day_start INTEGER NOT NULL,
  day_end INTEGER NOT NULL,
  goal_text TEXT,
  completion_banner_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sprint_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID NOT NULL REFERENCES public.sprint_phases(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_checkpoint BOOLEAN DEFAULT false,
  is_final BOOLEAN DEFAULT false,
  success_metrics TEXT,
  common_mistakes TEXT,
  templates JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sprint_task_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.sprint_tasks(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sprint_task_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES public.sprint_tasks(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started',
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  task_day INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, task_id)
);

-- Journey milestones
CREATE TABLE IF NOT EXISTS public.journey_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_journey_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  milestone_id UUID NOT NULL REFERENCES public.journey_milestones(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, milestone_id)
);

-- CSM delegations
CREATE TABLE IF NOT EXISTS public.csm_delegations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_csm_id UUID NOT NULL,
  to_csm_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Support tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'open',
  assigned_to UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ticket_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ticket_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL UNIQUE,
  sync_status TEXT,
  sync_attempted_at TIMESTAMPTZ,
  external_ticket_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- System settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Scheduled messages
CREATE TABLE IF NOT EXISTS public.scheduled_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.community_channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Brand leads
CREATE TABLE IF NOT EXISTS public.brand_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  category TEXT,
  business_model TEXT,
  website TEXT,
  amazon_url TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Call RSVPs
CREATE TABLE IF NOT EXISTS public.call_rsvps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID NOT NULL REFERENCES public.calendar_calls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'attending',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (call_id, user_id)
);

-- Community channel additional columns (if missing)
DO $$ BEGIN
  ALTER TABLE public.community_channels ADD COLUMN IF NOT EXISTS is_read_only BOOLEAN DEFAULT false;
  ALTER TABLE public.community_channels ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
  ALTER TABLE public.community_channels ADD COLUMN IF NOT EXISTS pin_order INTEGER DEFAULT 0;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Community messages additional columns (if missing)
DO $$ BEGIN
  ALTER TABLE public.community_messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
  ALTER TABLE public.community_messages ADD COLUMN IF NOT EXISTS pinned_by UUID;
  ALTER TABLE public.community_messages ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;
  ALTER TABLE public.community_messages ADD COLUMN IF NOT EXISTS shared_from_thread_id UUID;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 5. Enable RLS on new tables
ALTER TABLE public.sprint_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_task_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_journey_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csm_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_rsvps ENABLE ROW LEVEL SECURITY;

-- 6. Basic RLS policies (permissive for dev)
-- Sprint
CREATE POLICY "Anyone can view sprint phases" ON public.sprint_phases FOR SELECT USING (true);
CREATE POLICY "Admins can manage sprint phases" ON public.sprint_phases FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can view sprint tasks" ON public.sprint_tasks FOR SELECT USING (true);
CREATE POLICY "Admins can manage sprint tasks" ON public.sprint_tasks FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can view sprint modules" ON public.sprint_task_modules FOR SELECT USING (true);
CREATE POLICY "Users can manage own completions" ON public.sprint_task_completions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all completions" ON public.sprint_task_completions FOR SELECT USING (is_admin(auth.uid()));

-- Milestones
CREATE POLICY "Anyone can view milestones" ON public.journey_milestones FOR SELECT USING (true);
CREATE POLICY "Admins can manage milestones" ON public.journey_milestones FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can manage own milestone progress" ON public.user_journey_milestones FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all milestone progress" ON public.user_journey_milestones FOR SELECT USING (is_admin(auth.uid()));

-- CSM delegations
CREATE POLICY "CSMs and admins can manage delegations" ON public.csm_delegations FOR ALL USING (is_admin(auth.uid()) OR auth.uid() = from_csm_id OR auth.uid() = to_csm_id);

-- Support tickets
CREATE POLICY "Users can manage own tickets" ON public.support_tickets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all tickets" ON public.support_tickets FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Assigned staff can view tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = assigned_to);
CREATE POLICY "Users can view own ticket responses" ON public.ticket_responses FOR SELECT USING (EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_responses.ticket_id AND user_id = auth.uid()));
CREATE POLICY "Users can add responses to own tickets" ON public.ticket_responses FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_responses.ticket_id AND (user_id = auth.uid() OR assigned_to = auth.uid())));
CREATE POLICY "Admins can manage all responses" ON public.ticket_responses FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage ticket metadata" ON public.ticket_metadata FOR ALL USING (is_admin(auth.uid()));

-- System settings
CREATE POLICY "Admins can manage settings" ON public.system_settings FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can read public settings" ON public.system_settings FOR SELECT USING (true);

-- Scheduled messages
CREATE POLICY "Admins can manage scheduled messages" ON public.scheduled_messages FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can manage own scheduled messages" ON public.scheduled_messages FOR ALL USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

-- Brand leads
CREATE POLICY "Users can manage own leads" ON public.brand_leads FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all leads" ON public.brand_leads FOR SELECT USING (is_admin(auth.uid()));

-- Call RSVPs
CREATE POLICY "Users can manage own RSVPs" ON public.call_rsvps FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view RSVPs" ON public.call_rsvps FOR SELECT USING (true);

-- 7. Auth trigger (if not already created)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Fix the leaderboard refresh to handle empty table
CREATE OR REPLACE FUNCTION public.refresh_leaderboard_cache()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  TRUNCATE public.leaderboard_cache;
  INSERT INTO public.leaderboard_cache (user_id, total_points, rank, updated_at)
  WITH user_activity_points AS (SELECT user_id, COALESCE(SUM(points), 0) as points FROM public.user_points GROUP BY user_id),
  user_achievement_points AS (SELECT uab.user_id, COALESCE(SUM(ab.points_value), 0) as points FROM public.user_achievement_badges uab JOIN public.achievement_badges ab ON ab.id = uab.badge_id GROUP BY uab.user_id),
  user_habit_points AS (SELECT uhb.user_id, COALESCE(SUM(hb.points_value), 0) as points FROM public.user_habit_badges uhb JOIN public.habit_badges hb ON hb.id = uhb.badge_id GROUP BY uhb.user_id),
  all_users AS (SELECT user_id FROM user_activity_points UNION SELECT user_id FROM user_achievement_points UNION SELECT user_id FROM user_habit_points)
  SELECT au.user_id, (COALESCE(uap.points, 0) + COALESCE(uachp.points, 0) + COALESCE(uhp.points, 0))::INTEGER as total_points,
    ROW_NUMBER() OVER (ORDER BY (COALESCE(uap.points, 0) + COALESCE(uachp.points, 0) + COALESCE(uhp.points, 0)) DESC)::INTEGER as rank, now()
  FROM all_users au
  LEFT JOIN user_activity_points uap ON uap.user_id = au.user_id
  LEFT JOIN user_achievement_points uachp ON uachp.user_id = au.user_id
  LEFT JOIN user_habit_points uhp ON uhp.user_id = au.user_id
  WHERE (COALESCE(uap.points, 0) + COALESCE(uachp.points, 0) + COALESCE(uhp.points, 0)) > 0
  ORDER BY rank;
END;
$$;

-- Done!
SELECT 'Schema fix complete. Now run the seed-content.mjs script again.' as status;

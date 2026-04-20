-- ============================================================================
-- SUPABASE FULL SCHEMA EXPORT
-- Project: mjemehqhirspbcetibki
-- Generated: 2026-02-12
-- 
-- This file contains the complete database schema for replicating the
-- Supabase project. Run this on a fresh Supabase project to recreate
-- all tables, functions, triggers, RLS policies, and storage buckets.
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ============================================================================
-- 2. ENUM TYPES
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'mega_admin', 'operations', 'client_stb', 'client_elite', 'client_ultimate');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.badge_category AS ENUM ('onboarding', 'learning', 'trading_performance', 'consistency', 'community', 'special');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.badge_type AS ENUM ('onboarding_complete', 'first_homework', 'first_trade', 'streak_7', 'streak_30', 'perfect_week');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.milestone_type AS ENUM ('onboarding_complete', 'first_live_call', 'first_homework', 'first_trade', 'first_green_day', 'first_week_complete', 'first_quiz_passed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 3. TABLES (dependency order)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Independent tables (no FK to other public tables)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  role_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  tier_order INTEGER NOT NULL DEFAULT 0,
  feature_access JSONB,
  feature_visibility JSONB,
  is_active BOOLEAN DEFAULT true,
  upsell_funnel_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  course_order INTEGER NOT NULL,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  visible_tiers TEXT[],
  visible_tier_ids UUID[],
  catalog_visible_tier_ids UUID[],
  upsell_funnel_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  visible_tier_ids UUID[],
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value TEXT,
  description TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_version (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL DEFAULT '1.0.0' UNIQUE,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  event_type TEXT DEFAULT 'community_call',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coaches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  booking_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_emoji TEXT,
  is_active BOOLEAN DEFAULT true,
  visible_tier_ids UUID[],
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_dm_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  blocked_by UUID NOT NULL,
  reason TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  blocked_at TIMESTAMPTZ DEFAULT now(),
  unblocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.calendar_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  call_date DATE NOT NULL,
  call_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  call_link TEXT NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  series_id UUID,
  visible_tiers TEXT[],
  visible_tier_ids UUID[],
  created_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.call_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  recorded_date DATE NOT NULL,
  recorded_time TIME,
  duration_minutes INTEGER,
  recording_url TEXT NOT NULL,
  thumbnail_url TEXT,
  tags TEXT[] DEFAULT '{}',
  additional_links JSONB,
  visible_tiers TEXT[],
  visible_tier_ids UUID[],
  created_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.achievement_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  badge_key TEXT NOT NULL UNIQUE,
  badge_name TEXT NOT NULL,
  description TEXT,
  icon_emoji TEXT DEFAULT '🏆',
  tier TEXT NOT NULL,
  category public.badge_category NOT NULL,
  requirement_type TEXT,
  requirement_value JSONB,
  points_value INTEGER DEFAULT 0,
  auto_award BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.habit_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  category TEXT,
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.habit_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  badge_key TEXT NOT NULL UNIQUE,
  badge_name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  tier TEXT,
  requirement_type TEXT,
  requirement_value INTEGER,
  points_value INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.homework_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  points_value INTEGER DEFAULT 0,
  is_exam BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.enigma_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_number INTEGER NOT NULL,
  win_rate NUMERIC NOT NULL,
  risk_reward NUMERIC NOT NULL,
  trailing_drawdown NUMERIC NOT NULL,
  max_consecutive_trades INTEGER NOT NULL,
  coefficient_a NUMERIC,
  coefficient_b NUMERIC,
  coefficient_c NUMERIC,
  remainder NUMERIC,
  is_negative BOOLEAN,
  is_zero BOOLEAN,
  conservative_risk NUMERIC,
  neutral_risk NUMERIC,
  aggressive_risk NUMERIC,
  all_possible_triples TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.losing_streak_probabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  win_rate NUMERIC NOT NULL,
  max_consecutive_trades INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.market_snapshot (
  id SERIAL PRIMARY KEY,
  ticker TEXT,
  timeframe TEXT,
  signal_type TEXT,
  signal_id TEXT,
  signal_info TEXT,
  date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.micro_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  archetype TEXT NOT NULL,
  lesson_text TEXT NOT NULL,
  citation TEXT NOT NULL,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prompt_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  tooltip TEXT NOT NULL,
  mission TEXT NOT NULL,
  prompt_body TEXT,
  archetypes TEXT[] NOT NULL,
  feature_mode TEXT NOT NULL DEFAULT 'ai_chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.upsell_funnels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  funnel_url TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.facebook_ad_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  facebook_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  ad_account_id TEXT,
  ad_account_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.impersonation_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  admin_email TEXT NOT NULL,
  target_user_id UUID NOT NULL,
  target_email TEXT NOT NULL,
  impersonated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Tables referencing auth.users (user_id -> auth.users.id)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL PRIMARY KEY,
  user_email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  tier_id UUID REFERENCES public.tiers(id),
  role_id UUID REFERENCES public.roles(id),
  is_active BOOLEAN DEFAULT true,
  coach_id UUID,
  shopify_shop_domain TEXT,
  shopify_shop_name TEXT,
  shopify_access_token TEXT,
  store_activated BOOLEAN DEFAULT false,
  store_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_public_profiles (
  id UUID NOT NULL PRIMARY KEY,
  user_email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role_id UUID,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_title TEXT NOT NULL,
  session_type TEXT DEFAULT 'ai_chat',
  agent_type TEXT DEFAULT 'smart_trader_ai',
  assessment_handle TEXT,
  assessment_title TEXT,
  is_archived BOOLEAN DEFAULT false,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_title TEXT,
  chat_type TEXT NOT NULL DEFAULT 'assessment',
  assessment_handle TEXT,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notebook_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  citations JSONB,
  session_id UUID,
  message_id UUID,
  pinned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trader_profiles (
  id UUID NOT NULL PRIMARY KEY,
  experience_level TEXT NOT NULL,
  primary_market TEXT,
  trade_style TEXT,
  capital_type TEXT,
  learning_style TEXT,
  review_habit TEXT,
  success_definition TEXT,
  goal_6mo TEXT,
  stress_baseline INTEGER,
  common_mistakes TEXT,
  archetype TEXT,
  habit_loss_raw TEXT,
  obstacle_raw TEXT,
  weekly_opt_in BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trade_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trade_date DATE NOT NULL,
  entry_model TEXT NOT NULL,
  outcome TEXT NOT NULL,
  total_profit NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  screenshot_url TEXT,
  entry_logic TEXT,
  trade_execution TEXT,
  emotionally_stable BOOLEAN,
  cared_about_outcome BOOLEAN,
  emotions TEXT[],
  emotions_affected_decisions BOOLEAN,
  profit_target_question TEXT,
  stop_loss_question TEXT,
  review_status TEXT,
  review_feedback TEXT,
  review_screenshots TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  reviewed_timezone TEXT,
  assigned_to UUID,
  assigned_at TIMESTAMPTZ,
  coach_notes TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_timezone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trading_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_name TEXT NOT NULL,
  current_balance NUMERIC NOT NULL,
  trailing_drawdown NUMERIC NOT NULL,
  win_rate NUMERIC NOT NULL DEFAULT 50,
  risk_reward NUMERIC NOT NULL DEFAULT 1.5,
  max_consecutive_trades INTEGER,
  experience_level TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  trading_session TEXT,
  time_for_trades TEXT,
  trades_per_week INTEGER,
  commission_es NUMERIC DEFAULT 0,
  commission_nq NUMERIC DEFAULT 0,
  commission_ym NUMERIC DEFAULT 0,
  commission_cl NUMERIC DEFAULT 0,
  commission_mes NUMERIC DEFAULT 0,
  commission_mnq NUMERIC DEFAULT 0,
  commission_mym NUMERIC DEFAULT 0,
  commission_mcl NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trading_metrics_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period TEXT NOT NULL,
  period_start_date DATE NOT NULL,
  trades_taken INTEGER,
  total_profit NUMERIC,
  win_ratio NUMERIC,
  entry_models_breakdown JSONB,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  review_date DATE NOT NULL,
  review_type TEXT NOT NULL,
  htf_bias TEXT,
  intraday_bias TEXT,
  news_releases TEXT,
  expectations TEXT,
  expected_figures TEXT,
  what_happened TEXT,
  results_narrative TEXT,
  what_learned TEXT,
  daily_pnl NUMERIC,
  trades_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.weekly_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start_date DATE NOT NULL,
  emotional_state TEXT,
  confidence_level INTEGER,
  biggest_win TEXT,
  biggest_challenge TEXT,
  goals_next_week TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start_date)
);

CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  total_pnl NUMERIC DEFAULT 0,
  win_rate NUMERIC DEFAULT 0,
  avg_winner NUMERIC DEFAULT 0,
  avg_loser NUMERIC DEFAULT 0,
  best_trade NUMERIC DEFAULT 0,
  worst_trade NUMERIC DEFAULT 0,
  most_traded_model TEXT,
  emotional_summary JSONB,
  report_data JSONB,
  ai_summary TEXT,
  ai_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_ad_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL,
  campaign_name TEXT,
  spend NUMERIC,
  clicks INTEGER,
  ctr NUMERIC,
  cpc NUMERIC,
  cpm NUMERIC,
  add_to_carts INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, entry_date)
);

CREATE TABLE IF NOT EXISTS public.user_habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  habit_name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  template_id UUID REFERENCES public.habit_templates(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, habit_name)
);

CREATE TABLE IF NOT EXISTS public.leaderboard_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER,
  rank INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_login_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_login_date DATE,
  total_logins INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  milestone_type public.milestone_type NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, milestone_type)
);

CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  step_key TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_ai_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  interaction_type TEXT NOT NULL,
  interaction_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  activity_type TEXT NOT NULL,
  activity_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_type public.badge_type NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

CREATE TABLE IF NOT EXISTS public.user_review_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  coach_id UUID NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_task_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL,
  submission_data JSONB,
  file_url TEXT,
  status TEXT DEFAULT 'submitted',
  feedback TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ugc_video_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_credits INTEGER NOT NULL DEFAULT 0,
  used_credits INTEGER NOT NULL DEFAULT 0,
  source TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ugc_video_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_url TEXT,
  product_name TEXT,
  product_image_url TEXT,
  script TEXT,
  avatar_id TEXT,
  avatar_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  video_url TEXT,
  heygen_video_id TEXT,
  error_message TEXT,
  credits_used INTEGER NOT NULL DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Tables with FK to other public tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  phase_order INTEGER NOT NULL,
  order_index INTEGER,
  points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  unlock_type TEXT,
  unlock_condition JSONB,
  unlock_delay_days INTEGER,
  required_phase_id UUID REFERENCES public.phases(id),
  requires_previous_completion BOOLEAN DEFAULT false,
  visible_tiers TEXT[],
  visible_tier_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID REFERENCES public.phases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_description TEXT,
  task_order INTEGER NOT NULL,
  task_type TEXT,
  content JSONB,
  content_url TEXT,
  tier TEXT,
  points INTEGER DEFAULT 0,
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  unlock_type TEXT,
  due_date_enabled BOOLEAN DEFAULT false,
  due_date_days INTEGER,
  due_date_start_type TEXT,
  due_date_start_phase_id UUID REFERENCES public.phases(id),
  visibility_condition_enabled BOOLEAN DEFAULT false,
  visibility_condition_field_id UUID,
  visibility_condition_value TEXT,
  visibility_conditions JSONB,
  visible_tiers TEXT[],
  visible_tier_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  response JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, task_id)
);

CREATE TABLE IF NOT EXISTS public.discipline_task_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT,
  section_type TEXT NOT NULL,
  data JSONB,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.discipline_task_form_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL,
  placeholder TEXT,
  help_text TEXT,
  default_value TEXT,
  options TEXT[],
  required BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id),
  module_id TEXT NOT NULL,
  lesson_title TEXT,
  completed BOOLEAN DEFAULT false,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_course_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  granted_by UUID,
  granted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  linked_phase_id UUID NOT NULL REFERENCES public.phases(id),
  course_id UUID REFERENCES public.courses(id),
  passing_grade NUMERIC NOT NULL DEFAULT 70,
  quiz_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  answer_options JSONB NOT NULL DEFAULT '[]',
  correct_answer_id TEXT NOT NULL,
  explanation TEXT,
  question_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id),
  score NUMERIC NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  answers JSONB NOT NULL DEFAULT '{}',
  attempt_number INTEGER NOT NULL DEFAULT 1,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.phase_quiz_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID NOT NULL REFERENCES public.phases(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  agent_persona TEXT,
  citations JSONB,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_dm_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.community_dm_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  last_read_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.community_dm_read_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.community_dm_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, conversation_id)
);

CREATE TABLE IF NOT EXISTS public.community_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.community_channels(id) ON DELETE CASCADE,
  dm_conversation_id UUID REFERENCES public.community_dm_conversations(id) ON DELETE CASCADE,
  parent_message_id UUID REFERENCES public.community_messages(id) ON DELETE SET NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB,
  mentions TEXT[],
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  ai_flagged BOOLEAN DEFAULT false,
  flagged_by UUID,
  flag_reason TEXT,
  moderation_status TEXT DEFAULT 'none',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT message_destination CHECK (
    (channel_id IS NOT NULL AND dm_conversation_id IS NULL)
    OR (channel_id IS NULL AND dm_conversation_id IS NOT NULL)
  ),
  CONSTRAINT community_messages_moderation_status_check CHECK (
    moderation_status = ANY (ARRAY['none', 'pending', 'approved', 'rejected'])
  )
);

CREATE TABLE IF NOT EXISTS public.community_message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS public.community_user_channel_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel_id UUID NOT NULL REFERENCES public.community_channels(id) ON DELETE CASCADE,
  notification_level TEXT DEFAULT 'all',
  last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, channel_id),
  CONSTRAINT community_user_channel_settings_notification_level_check CHECK (
    notification_level = ANY (ARRAY['all', 'mentions_only', 'muted'])
  )
);

CREATE TABLE IF NOT EXISTS public.habit_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_habit_id UUID NOT NULL REFERENCES public.user_habits(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  skipped BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, user_habit_id, completion_date)
);

CREATE TABLE IF NOT EXISTS public.habit_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_habit_id UUID NOT NULL REFERENCES public.user_habits(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  last_completion_date DATE,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, user_habit_id)
);

CREATE TABLE IF NOT EXISTS public.user_achievement_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.achievement_badges(id),
  awarded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS public.user_habit_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.habit_badges(id),
  awarded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS public.user_homework_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  homework_id UUID NOT NULL REFERENCES public.homework_assignments(id),
  status TEXT DEFAULT 'not_started',
  submission_text TEXT,
  submission_url TEXT,
  score INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.facebook_ad_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connection_id UUID REFERENCES public.facebook_ad_connections(id) ON DELETE CASCADE,
  ad_account_id TEXT,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  date DATE NOT NULL,
  impressions INTEGER,
  clicks INTEGER,
  spend NUMERIC,
  ctr NUMERIC,
  cpc NUMERIC,
  cpm NUMERIC,
  add_to_carts INTEGER,
  purchases INTEGER,
  purchase_value NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, ad_account_id, campaign_id, date)
);

CREATE TABLE IF NOT EXISTS public.ugc_credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credit_id UUID REFERENCES public.ugc_video_credits(id),
  transaction_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER,
  video_generation_id UUID REFERENCES public.ugc_video_generations(id),
  description TEXT,
  performed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. INDEXES (non-primary-key, non-unique-constraint)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session_id ON public.ai_chat_messages USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_id ON public.ai_chat_sessions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_community_dm_participants_conv ON public.community_dm_participants USING btree (conversation_id);
CREATE INDEX IF NOT EXISTS idx_community_dm_participants_user ON public.community_dm_participants USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_dm_read_status_user_conversation ON public.community_dm_read_status USING btree (user_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_community_reactions_message ON public.community_message_reactions USING btree (message_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_channel ON public.community_messages USING btree (channel_id) WHERE channel_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_community_messages_created ON public.community_messages USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_messages_dm ON public.community_messages USING btree (dm_conversation_id) WHERE dm_conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_community_messages_parent ON public.community_messages USING btree (parent_message_id) WHERE parent_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_community_messages_sender ON public.community_messages USING btree (sender_id);
CREATE INDEX IF NOT EXISTS idx_user_channel_settings_last_read ON public.community_user_channel_settings USING btree (user_id, channel_id, last_read_at);
CREATE INDEX IF NOT EXISTS idx_course_progress_course_id ON public.course_progress USING btree (course_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_user_id ON public.course_progress USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_ad_connections_user_id ON public.facebook_ad_connections USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_ad_metrics_campaign_id ON public.facebook_ad_metrics USING btree (campaign_id);
CREATE INDEX IF NOT EXISTS idx_facebook_ad_metrics_date ON public.facebook_ad_metrics USING btree (date);
CREATE INDEX IF NOT EXISTS idx_facebook_ad_metrics_user_id ON public.facebook_ad_metrics USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON public.habit_completions USING btree (completion_date);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_id ON public.habit_completions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_phase_id ON public.tasks USING btree (phase_id);
CREATE INDEX IF NOT EXISTS idx_tasks_task_order ON public.tasks USING btree (task_order);
CREATE INDEX IF NOT EXISTS idx_task_responses_status ON public.task_responses USING btree (status);
CREATE INDEX IF NOT EXISTS idx_task_responses_task_id ON public.task_responses USING btree (task_id);
CREATE INDEX IF NOT EXISTS idx_task_responses_user_id ON public.task_responses USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz_id ON public.quiz_submissions USING btree (quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_user_id ON public.quiz_submissions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_trade_records_assigned_to ON public.trade_records USING btree (assigned_to);
CREATE INDEX IF NOT EXISTS idx_trade_records_review_status ON public.trade_records USING btree (review_status);
CREATE INDEX IF NOT EXISTS idx_trade_records_trade_date ON public.trade_records USING btree (trade_date);
CREATE INDEX IF NOT EXISTS idx_trade_records_user_id ON public.trade_records USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_ugc_credit_transactions_user_id ON public.ugc_credit_transactions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_ugc_video_credits_expires_at ON public.ugc_video_credits USING btree (expires_at);
CREATE INDEX IF NOT EXISTS idx_ugc_video_credits_user_id ON public.ugc_video_credits USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_ugc_video_generations_status ON public.ugc_video_generations USING btree (status);
CREATE INDEX IF NOT EXISTS idx_ugc_video_generations_user_id ON public.ugc_video_generations USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier_id ON public.user_profiles USING btree (tier_id);

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.achievement_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_dm_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_dm_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_user_channel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_ad_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipline_task_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipline_task_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enigma_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_ad_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_ad_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impersonation_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.losing_streak_probabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.micro_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_quiz_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trader_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_metrics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ugc_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ugc_video_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ugc_video_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsell_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievement_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_habit_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_homework_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_login_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_public_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_review_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. SECURITY DEFINER FUNCTIONS (needed by RLS policies)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role_key(_user_id uuid, _role_key text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.roles r ON r.id = up.role_id
    WHERE up.id = _user_id AND r.role_key = _role_key AND up.is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.roles r ON r.id = up.role_id
    WHERE up.id = _user_id AND r.role_key IN ('admin', 'mega_admin') AND up.is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_dm_conversation_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_dm_participants
    WHERE user_id = _user_id AND conversation_id = _conversation_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_user_blocked_from_chat(p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_blocked_users
    WHERE user_id = p_user_id AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.has_course_access(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  course_visible_tier_ids UUID[];
  user_tier_id UUID;
  has_individual_access BOOLEAN;
  all_tier_id UUID;
BEGIN
  SELECT id INTO all_tier_id FROM tiers WHERE tier_key = 'all';
  SELECT visible_tier_ids INTO course_visible_tier_ids FROM courses WHERE id = _course_id;
  IF all_tier_id = ANY(course_visible_tier_ids) THEN RETURN TRUE; END IF;
  SELECT EXISTS (SELECT 1 FROM user_course_access WHERE user_id = _user_id AND course_id = _course_id) INTO has_individual_access;
  IF has_individual_access THEN RETURN TRUE; END IF;
  SELECT tier_id INTO user_tier_id FROM user_profiles WHERE id = _user_id;
  IF user_tier_id IS NULL THEN
    SELECT t.id INTO user_tier_id FROM user_roles ur JOIN tiers t ON t.tier_key = ur.role::text WHERE ur.user_id = _user_id LIMIT 1;
  END IF;
  RETURN user_tier_id = ANY(course_visible_tier_ids);
END;
$$;

CREATE OR REPLACE FUNCTION public.has_feature_access(_user_id uuid, _feature_key text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_tier_id uuid;
  feature_enabled boolean;
BEGIN
  SELECT tier_id INTO user_tier_id FROM user_profiles WHERE id = _user_id;
  IF user_tier_id IS NULL THEN RETURN false; END IF;
  SELECT COALESCE((feature_access->>_feature_key)::boolean, false) INTO feature_enabled FROM tiers WHERE id = user_tier_id AND is_active = true;
  RETURN COALESCE(feature_enabled, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_all_admin_ids()
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(ARRAY_AGG(up.id), ARRAY[]::UUID[])
  FROM public.user_profiles up
  JOIN public.roles r ON r.id = up.role_id
  WHERE r.role_key IN ('admin', 'mega_admin') AND up.is_active = true
$$;

-- ============================================================================
-- 7. RLS POLICIES
-- ============================================================================

-- achievement_badges
CREATE POLICY "Admins can manage badges" ON public.achievement_badges FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can view active badges" ON public.achievement_badges FOR SELECT USING (is_active = true);

-- ai_chat_messages
CREATE POLICY "Users can create messages in own sessions" ON public.ai_chat_messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM ai_chat_sessions WHERE ai_chat_sessions.id = ai_chat_messages.session_id AND ai_chat_sessions.user_id = auth.uid()));
CREATE POLICY "Users can delete messages in own sessions" ON public.ai_chat_messages FOR DELETE USING (EXISTS (SELECT 1 FROM ai_chat_sessions WHERE ai_chat_sessions.id = ai_chat_messages.session_id AND ai_chat_sessions.user_id = auth.uid()));
CREATE POLICY "Users can update messages in own sessions" ON public.ai_chat_messages FOR UPDATE USING (EXISTS (SELECT 1 FROM ai_chat_sessions WHERE ai_chat_sessions.id = ai_chat_messages.session_id AND ai_chat_sessions.user_id = auth.uid()));
CREATE POLICY "Users can view messages from own sessions" ON public.ai_chat_messages FOR SELECT USING (EXISTS (SELECT 1 FROM ai_chat_sessions WHERE ai_chat_sessions.id = ai_chat_messages.session_id AND ai_chat_sessions.user_id = auth.uid()));

-- ai_chat_sessions
CREATE POLICY "Users can create own chat sessions" ON public.ai_chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat sessions" ON public.ai_chat_sessions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own chat sessions" ON public.ai_chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own chat sessions" ON public.ai_chat_sessions FOR SELECT USING (auth.uid() = user_id);

-- announcements
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "All users can view announcements" ON public.announcements FOR SELECT USING (true);

-- app_config
CREATE POLICY "Anyone can view vapid_public_key" ON public.app_config FOR SELECT USING (config_key = 'vapid_public_key');
CREATE POLICY "Mega admins can insert config" ON public.app_config FOR INSERT WITH CHECK (has_role(auth.uid(), 'mega_admin'));
CREATE POLICY "Mega admins can update config" ON public.app_config FOR UPDATE USING (has_role(auth.uid(), 'mega_admin'));
CREATE POLICY "Mega admins can view all config" ON public.app_config FOR SELECT USING (has_role(auth.uid(), 'mega_admin'));

-- app_version
CREATE POLICY "Anyone can view version" ON public.app_version FOR SELECT USING (true);
CREATE POLICY "Mega admins can update version" ON public.app_version FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- calendar_calls
CREATE POLICY "Admins can delete calls" ON public.calendar_calls FOR DELETE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can insert calls" ON public.calendar_calls FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update calls" ON public.calendar_calls FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "All authenticated users can view active calls" ON public.calendar_calls FOR SELECT USING (is_active = true);

-- calendar_events
CREATE POLICY "Admins can manage calendar events" ON public.calendar_events FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "All users can view calendar events" ON public.calendar_events FOR SELECT USING (true);

-- call_recordings
CREATE POLICY "Admins can delete recordings" ON public.call_recordings FOR DELETE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can insert recordings" ON public.call_recordings FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update recordings" ON public.call_recordings FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Users can view accessible recordings" ON public.call_recordings FOR SELECT USING (
  is_active = true AND (
    is_admin(auth.uid())
    OR visible_tier_ids IS NULL
    OR array_length(visible_tier_ids, 1) IS NULL
    OR EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.tier_id = ANY(call_recordings.visible_tier_ids))
    OR EXISTS (SELECT 1 FROM tiers WHERE tiers.tier_key = 'all' AND tiers.id = ANY(call_recordings.visible_tier_ids))
  )
);

-- chat_sessions
CREATE POLICY "Users can create their own chat sessions" ON public.chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own chat sessions" ON public.chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own chat sessions" ON public.chat_sessions FOR SELECT USING (auth.uid() = user_id);

-- coaches
CREATE POLICY "Admins can manage coaches" ON public.coaches FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can view active coaches" ON public.coaches FOR SELECT USING (is_active = true);

-- community_blocked_users
CREATE POLICY "Admins can delete blocked users" ON public.community_blocked_users FOR DELETE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can insert blocked users" ON public.community_blocked_users FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update blocked users" ON public.community_blocked_users FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view blocked users" ON public.community_blocked_users FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Users can check own block status" ON public.community_blocked_users FOR SELECT USING (auth.uid() = user_id);

-- community_channels
CREATE POLICY "Admins can manage channels" ON public.community_channels FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Users can view accessible channels" ON public.community_channels FOR SELECT USING (
  is_active = true AND (
    is_admin(auth.uid())
    OR visible_tier_ids IS NULL
    OR array_length(visible_tier_ids, 1) IS NULL
    OR EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.tier_id = ANY(community_channels.visible_tier_ids))
    OR EXISTS (SELECT 1 FROM tiers WHERE tiers.tier_key = 'all' AND tiers.id = ANY(community_channels.visible_tier_ids))
  )
);

-- community_dm_conversations
CREATE POLICY "Admins can view all DM conversations" ON public.community_dm_conversations FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Users can create DM conversations" ON public.community_dm_conversations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update their DM conversations" ON public.community_dm_conversations FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM community_dm_participants WHERE community_dm_participants.conversation_id = community_dm_conversations.id AND community_dm_participants.user_id = auth.uid()));
CREATE POLICY "Users can view their DM conversations" ON public.community_dm_conversations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM community_dm_participants WHERE community_dm_participants.conversation_id = community_dm_conversations.id AND community_dm_participants.user_id = auth.uid()));

-- community_dm_participants
CREATE POLICY "Admins can view all DM participants" ON public.community_dm_participants FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Users can add participants to conversations" ON public.community_dm_participants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own participant record" ON public.community_dm_participants FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can view participants in their conversations" ON public.community_dm_participants FOR SELECT USING (user_id = auth.uid() OR is_dm_conversation_participant(auth.uid(), conversation_id));

-- community_dm_read_status
CREATE POLICY "Users can insert own read status" ON public.community_dm_read_status FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own read status" ON public.community_dm_read_status FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own read status" ON public.community_dm_read_status FOR SELECT USING (auth.uid() = user_id);

-- community_message_reactions
CREATE POLICY "Users can add their own reactions" ON public.community_message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own reactions" ON public.community_message_reactions FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Users can view reactions" ON public.community_message_reactions FOR SELECT USING (EXISTS (SELECT 1 FROM community_messages WHERE community_messages.id = community_message_reactions.message_id));

-- community_messages
CREATE POLICY "Admins can view all messages" ON public.community_messages FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Authenticated users can subscribe to messages realtime" ON public.community_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can delete own messages or admins can delete any" ON public.community_messages FOR DELETE USING (sender_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "Users can send messages to accessible channels" ON public.community_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND (
    (channel_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM community_channels
      WHERE community_channels.id = community_messages.channel_id
        AND community_channels.is_active = true
        AND (
          is_admin(auth.uid())
          OR community_channels.visible_tier_ids IS NULL
          OR array_length(community_channels.visible_tier_ids, 1) IS NULL
          OR EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.tier_id = ANY(community_channels.visible_tier_ids))
          OR EXISTS (SELECT 1 FROM tiers WHERE tiers.tier_key = 'all' AND tiers.id = ANY(community_channels.visible_tier_ids))
        )
    ))
    OR (dm_conversation_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM community_dm_participants
      WHERE community_dm_participants.conversation_id = community_messages.dm_conversation_id
        AND community_dm_participants.user_id = auth.uid()
    ))
  )
);
CREATE POLICY "Users can update own messages or admins can update any" ON public.community_messages FOR UPDATE USING (sender_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "Users can view channel messages they have access to" ON public.community_messages FOR SELECT USING (
  (channel_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM community_channels
    WHERE community_channels.id = community_messages.channel_id
      AND community_channels.is_active = true
      AND (
        is_admin(auth.uid())
        OR community_channels.visible_tier_ids IS NULL
        OR array_length(community_channels.visible_tier_ids, 1) IS NULL
        OR EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.tier_id = ANY(community_channels.visible_tier_ids))
        OR EXISTS (SELECT 1 FROM tiers WHERE tiers.tier_key = 'all' AND tiers.id = ANY(community_channels.visible_tier_ids))
      )
  ))
  OR (dm_conversation_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM community_dm_participants
    WHERE community_dm_participants.conversation_id = community_messages.dm_conversation_id
      AND community_dm_participants.user_id = auth.uid()
  ))
);
CREATE POLICY "Users can view messages with moderation" ON public.community_messages FOR SELECT USING (
  is_admin(auth.uid())
  OR sender_id = auth.uid()
  OR (
    (is_hidden IS NULL OR is_hidden = false)
    AND (
      (channel_id IS NOT NULL AND EXISTS (SELECT 1 FROM community_channels c WHERE c.id = community_messages.channel_id AND c.is_active = true))
      OR (dm_conversation_id IS NOT NULL AND is_dm_conversation_participant(auth.uid(), dm_conversation_id))
    )
  )
);

-- community_user_channel_settings
CREATE POLICY "Users can manage their own channel settings" ON public.community_user_channel_settings FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view their own channel settings" ON public.community_user_channel_settings FOR SELECT USING (user_id = auth.uid());

-- course_progress
CREATE POLICY "Users can manage own course progress" ON public.course_progress FOR ALL USING (auth.uid() = user_id);

-- courses
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can view all active courses" ON public.courses FOR SELECT USING (is_active = true);

-- daily_ad_entries
CREATE POLICY "Users can create their own ad entries" ON public.daily_ad_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ad entries" ON public.daily_ad_entries FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own ad entries" ON public.daily_ad_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own ad entries" ON public.daily_ad_entries FOR SELECT USING (auth.uid() = user_id);

-- daily_reviews
CREATE POLICY "Admins can view all reviews" ON public.daily_reviews FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Users can insert own reviews" ON public.daily_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.daily_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own reviews" ON public.daily_reviews FOR SELECT USING (auth.uid() = user_id);

-- discipline_task_form_fields
CREATE POLICY "Admins can manage form fields" ON public.discipline_task_form_fields FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can view accessible form fields" ON public.discipline_task_form_fields FOR SELECT TO authenticated USING (
  is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM tasks t JOIN phases p ON t.phase_id = p.id
    WHERE t.id = discipline_task_form_fields.task_id
      AND t.is_active = true AND p.is_active = true
      AND has_course_access(auth.uid(), p.course_id)
      AND (t.visible_tier_ids IS NULL OR array_length(t.visible_tier_ids, 1) IS NULL
        OR EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.tier_id = ANY(t.visible_tier_ids)))
  )
);

-- discipline_task_sections
CREATE POLICY "Admins can manage task sections" ON public.discipline_task_sections FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can view accessible task sections" ON public.discipline_task_sections FOR SELECT TO authenticated USING (
  is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM tasks t JOIN phases p ON t.phase_id = p.id
    WHERE t.id = discipline_task_sections.task_id
      AND t.is_active = true AND p.is_active = true
      AND has_course_access(auth.uid(), p.course_id)
      AND (t.visible_tier_ids IS NULL OR array_length(t.visible_tier_ids, 1) IS NULL
        OR EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.tier_id = ANY(t.visible_tier_ids)))
  )
);

-- enigma_calculations
CREATE POLICY "Admins can manage calculations" ON public.enigma_calculations FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "All authenticated users can view calculations" ON public.enigma_calculations FOR SELECT USING (true);

-- facebook_ad_connections
CREATE POLICY "Users can delete their own connections" ON public.facebook_ad_connections FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own connections" ON public.facebook_ad_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own connections" ON public.facebook_ad_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own connections" ON public.facebook_ad_connections FOR SELECT USING (auth.uid() = user_id);

-- facebook_ad_metrics
CREATE POLICY "Users can delete their own metrics" ON public.facebook_ad_metrics FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own metrics" ON public.facebook_ad_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own metrics" ON public.facebook_ad_metrics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own metrics" ON public.facebook_ad_metrics FOR SELECT USING (auth.uid() = user_id);

-- habit_badges
CREATE POLICY "Anyone can view badges" ON public.habit_badges FOR SELECT USING (true);

-- habit_completions
CREATE POLICY "Users can delete their own completions" ON public.habit_completions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own completions" ON public.habit_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own completions" ON public.habit_completions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own completions" ON public.habit_completions FOR SELECT USING (auth.uid() = user_id);

-- habit_streaks
CREATE POLICY "Users can delete their own streaks" ON public.habit_streaks FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own streaks" ON public.habit_streaks FOR SELECT USING (auth.uid() = user_id);

-- habit_templates
CREATE POLICY "Anyone can view habit templates" ON public.habit_templates FOR SELECT USING (true);

-- homework_assignments
CREATE POLICY "Admins can manage homework" ON public.homework_assignments FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "All users can view homework" ON public.homework_assignments FOR SELECT USING (true);

-- impersonation_audit_log
CREATE POLICY "Admins can view impersonation logs" ON public.impersonation_audit_log FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Service role can insert audit logs" ON public.impersonation_audit_log FOR INSERT WITH CHECK (true);

-- leaderboard_cache
CREATE POLICY "Admins can manage leaderboard" ON public.leaderboard_cache FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "All users can view leaderboard" ON public.leaderboard_cache FOR SELECT USING (true);

-- losing_streak_probabilities
CREATE POLICY "Admins can manage probabilities" ON public.losing_streak_probabilities FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "All authenticated users can view probabilities" ON public.losing_streak_probabilities FOR SELECT USING (true);

-- market_snapshot
CREATE POLICY "Admins can manage market snapshots" ON public.market_snapshot FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Authenticated users can view market snapshots" ON public.market_snapshot FOR SELECT USING (true);

-- micro_lessons
CREATE POLICY "Anyone can view micro lessons" ON public.micro_lessons FOR SELECT USING (true);
CREATE POLICY "admin manage lessons" ON public.micro_lessons FOR ALL USING (true) WITH CHECK (true);

-- notebook_entries
CREATE POLICY "Users can create own notebook entries" ON public.notebook_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own notebook entries" ON public.notebook_entries FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own notebook entries" ON public.notebook_entries FOR SELECT USING (auth.uid() = user_id);

-- phase_quiz_requirements
CREATE POLICY "Admins and ops can manage phase quiz requirements" ON public.phase_quiz_requirements FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'mega_admin') OR has_role(auth.uid(), 'operations')) WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'mega_admin') OR has_role(auth.uid(), 'operations'));
CREATE POLICY "Authenticated users can view phase quiz requirements" ON public.phase_quiz_requirements FOR SELECT USING (auth.uid() IS NOT NULL);

-- phases
CREATE POLICY "Admins can manage phases" ON public.phases FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view all phases for management" ON public.phases FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Users can view phases from accessible courses" ON public.phases FOR SELECT USING (is_active = true AND has_course_access(auth.uid(), course_id));

-- prompt_catalog
CREATE POLICY "admin manage prompts" ON public.prompt_catalog FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public read prompts" ON public.prompt_catalog FOR SELECT USING (true);

-- push_subscriptions
CREATE POLICY "Users can manage their own push subscriptions" ON public.push_subscriptions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- quiz_questions
CREATE POLICY "Admins and ops can manage questions" ON public.quiz_questions FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'mega_admin') OR has_role(auth.uid(), 'operations'));
CREATE POLICY "Authenticated users can view questions for active quizzes" ON public.quiz_questions FOR SELECT USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_questions.quiz_id AND quizzes.is_active = true));

-- quiz_submissions
CREATE POLICY "Admins and ops can view all submissions" ON public.quiz_submissions FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'mega_admin') OR has_role(auth.uid(), 'operations'));
CREATE POLICY "Admins can delete any quiz submission" ON public.quiz_submissions FOR DELETE USING (is_admin(auth.uid()));
CREATE POLICY "Users can insert own submissions" ON public.quiz_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own submissions" ON public.quiz_submissions FOR SELECT USING (auth.uid() = user_id);

-- quizzes
CREATE POLICY "Admins can manage quizzes" ON public.quizzes FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Authenticated users can view active quizzes" ON public.quizzes FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);

-- resources
CREATE POLICY "Everyone can view active resources" ON public.resources FOR SELECT USING (is_active = true);
CREATE POLICY "Operations and Admins can manage resources" ON public.resources FOR ALL USING (has_role(auth.uid(), 'operations') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'mega_admin'));

-- roles
CREATE POLICY "Anyone can view active roles" ON public.roles FOR SELECT USING (is_active = true);
CREATE POLICY "Mega admins can manage roles" ON public.roles FOR ALL USING (has_role(auth.uid(), 'mega_admin'));

-- task_responses
CREATE POLICY "Admins can view all task responses" ON public.task_responses FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Users can insert own task responses" ON public.task_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own task responses" ON public.task_responses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own task responses" ON public.task_responses FOR SELECT USING (auth.uid() = user_id);

-- tasks
CREATE POLICY "Admins can manage tasks" ON public.tasks FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can view tasks" ON public.tasks FOR SELECT USING (true);

-- tiers
CREATE POLICY "Admins can manage tiers" ON public.tiers FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Anyone can view active tiers" ON public.tiers FOR SELECT USING (is_active = true);

-- trade_records
CREATE POLICY "Admins can update all trades" ON public.trade_records FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view all trades" ON public.trade_records FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Coaches can update assigned trades" ON public.trade_records FOR UPDATE USING (auth.uid() = assigned_to);
CREATE POLICY "Coaches can view assigned trades" ON public.trade_records FOR SELECT USING (auth.uid() = assigned_to);
CREATE POLICY "Users can insert own trades" ON public.trade_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trades" ON public.trade_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own trades" ON public.trade_records FOR SELECT USING (auth.uid() = user_id);

-- trader_profiles
CREATE POLICY "Users can insert own trader profile" ON public.trader_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own trader profile" ON public.trader_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own trader profile" ON public.trader_profiles FOR SELECT USING (auth.uid() = id);

-- trading_accounts
CREATE POLICY "Users can delete own trading accounts" ON public.trading_accounts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trading accounts" ON public.trading_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trading accounts" ON public.trading_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own trading accounts" ON public.trading_accounts FOR SELECT USING (auth.uid() = user_id);

-- trading_metrics_cache
CREATE POLICY "Admins can manage trading metrics cache" ON public.trading_metrics_cache FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Users can manage own trading metrics cache" ON public.trading_metrics_cache FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own trading metrics cache" ON public.trading_metrics_cache FOR SELECT USING (auth.uid() = user_id);

-- ugc_credit_transactions
CREATE POLICY "Users can view own transactions" ON public.ugc_credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- ugc_video_credits
CREATE POLICY "Admins can insert credits" ON public.ugc_video_credits FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update credits" ON public.ugc_video_credits FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Users can update own credits" ON public.ugc_video_credits FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own credits" ON public.ugc_video_credits FOR SELECT USING (auth.uid() = user_id);

-- ugc_video_generations
CREATE POLICY "Users can insert own videos" ON public.ugc_video_generations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own videos" ON public.ugc_video_generations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own videos" ON public.ugc_video_generations FOR SELECT USING (auth.uid() = user_id);

-- upsell_funnels
CREATE POLICY "Admins can manage upsell funnels" ON public.upsell_funnels FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Authenticated users can view upsell funnels" ON public.upsell_funnels FOR SELECT USING (auth.uid() IS NOT NULL);

-- user_achievement_badges
CREATE POLICY "System can insert achievement badges" ON public.user_achievement_badges FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own achievement badges" ON public.user_achievement_badges FOR SELECT USING (auth.uid() = user_id);

-- user_ai_interactions
CREATE POLICY "Admins can view ai interactions" ON public.user_ai_interactions FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Users can manage own ai interactions" ON public.user_ai_interactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own ai interactions" ON public.user_ai_interactions FOR SELECT USING (auth.uid() = user_id);

-- user_badges
CREATE POLICY "Admins can manage user badges" ON public.user_badges FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);

-- user_course_access
CREATE POLICY "Admins can manage course access" ON public.user_course_access FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can view own course access" ON public.user_course_access FOR SELECT USING (auth.uid() = user_id);

-- user_habit_badges
CREATE POLICY "Users can view own habit badges" ON public.user_habit_badges FOR SELECT USING (auth.uid() = user_id);

-- user_habits
CREATE POLICY "Users can delete own habits" ON public.user_habits FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON public.user_habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON public.user_habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own habits" ON public.user_habits FOR SELECT USING (auth.uid() = user_id);

-- user_homework_progress
CREATE POLICY "Admins can view all homework progress" ON public.user_homework_progress FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Users can manage own homework progress" ON public.user_homework_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own homework progress" ON public.user_homework_progress FOR SELECT USING (auth.uid() = user_id);

-- user_login_streaks
CREATE POLICY "Admins can view all login streaks" ON public.user_login_streaks FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "System can manage login streaks" ON public.user_login_streaks FOR ALL USING (true);
CREATE POLICY "Users can insert own login streaks" ON public.user_login_streaks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own login streaks" ON public.user_login_streaks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own login streaks" ON public.user_login_streaks FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_milestones
CREATE POLICY "System can manage milestones" ON public.user_milestones FOR ALL USING (true);
CREATE POLICY "Users can view own milestones" ON public.user_milestones FOR SELECT USING (auth.uid() = user_id);

-- user_onboarding
CREATE POLICY "Admins can manage all onboarding" ON public.user_onboarding FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can insert own onboarding" ON public.user_onboarding FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own onboarding" ON public.user_onboarding FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own onboarding" ON public.user_onboarding FOR SELECT USING (auth.uid() = user_id);

-- user_points
CREATE POLICY "System can insert points" ON public.user_points FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own points" ON public.user_points FOR SELECT USING (auth.uid() = user_id);

-- user_profiles
CREATE POLICY "Admins can manage all profiles" ON public.user_profiles FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view all profiles" ON public.user_profiles FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);

-- user_public_profiles
CREATE POLICY "Authenticated can view public profiles" ON public.user_public_profiles FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "No direct deletes" ON public.user_public_profiles FOR DELETE TO authenticated USING (false);
CREATE POLICY "No direct inserts" ON public.user_public_profiles FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "No direct updates" ON public.user_public_profiles FOR UPDATE TO authenticated USING (false);

-- user_review_assignments
CREATE POLICY "Admins can manage review assignments" ON public.user_review_assignments FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Users can view own review assignments" ON public.user_review_assignments FOR SELECT USING (auth.uid() = user_id);

-- user_roles
CREATE POLICY "Admins can manage user roles" ON public.user_roles FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- user_task_submissions
CREATE POLICY "Admins can manage task submissions" ON public.user_task_submissions FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Users can insert own task submissions" ON public.user_task_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own task submissions" ON public.user_task_submissions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own task submissions" ON public.user_task_submissions FOR SELECT USING (auth.uid() = user_id);

-- weekly_checkins
CREATE POLICY "Admins can view all checkins" ON public.weekly_checkins FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Users can insert own checkins" ON public.weekly_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checkins" ON public.weekly_checkins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own checkins" ON public.weekly_checkins FOR SELECT USING (auth.uid() = user_id);

-- weekly_reports
CREATE POLICY "Admins can manage all reports" ON public.weekly_reports FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can view own reports" ON public.weekly_reports FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- 8. REMAINING DATABASE FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.set_user_id_from_auth()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN IF NEW.user_id IS NULL THEN NEW.user_id := auth.uid(); END IF; RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.set_trader_profile_id_from_auth()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN IF NEW.id IS NULL THEN NEW.id := auth.uid(); END IF; RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.ensure_admins_in_dm(p_conversation_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE admin_ids UUID[]; admin_id UUID;
BEGIN
  admin_ids := get_all_admin_ids();
  IF admin_ids IS NOT NULL THEN
    FOREACH admin_id IN ARRAY admin_ids LOOP
      INSERT INTO community_dm_participants (conversation_id, user_id)
      VALUES (p_conversation_id, admin_id)
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END LOOP;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_admins_to_new_dm()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN PERFORM ensure_admins_in_dm(NEW.id); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.sync_user_public_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  PERFORM set_config('row_security', 'off', true);
  INSERT INTO public.user_public_profiles (id, user_email, first_name, last_name, avatar_url, role_id, is_active, updated_at)
  VALUES (NEW.id, NEW.user_email, NEW.first_name, NEW.last_name, NEW.avatar_url, NEW.role_id, COALESCE(NEW.is_active, true), now())
  ON CONFLICT (id) DO UPDATE SET
    user_email = EXCLUDED.user_email, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
    avatar_url = EXCLUDED.avatar_url, role_id = EXCLUDED.role_id, is_active = EXCLUDED.is_active, updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE default_role_id uuid := '6d8d1e65-f743-46fd-aa0e-bb47def1ce53';
BEGIN
  INSERT INTO public.user_profiles (id, user_email, first_name, last_name, phone, tier_id, role_id)
  VALUES (
    NEW.id, NEW.email, NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone', (NEW.raw_user_meta_data->>'tier_id')::uuid,
    COALESCE((NEW.raw_user_meta_data->>'role_id')::uuid, default_role_id)
  )
  ON CONFLICT (id) DO UPDATE SET
    user_email = COALESCE(EXCLUDED.user_email, user_profiles.user_email),
    first_name = COALESCE(EXCLUDED.first_name, user_profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, user_profiles.last_name),
    phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
    tier_id = COALESCE(EXCLUDED.tier_id, user_profiles.tier_id),
    role_id = COALESCE(EXCLUDED.role_id, user_profiles.role_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_mega_admin_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.email = 'jesserogers@smarttradingblueprint.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'mega_admin') ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_onboarding_complete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_milestones SET completed = true, completed_at = NOW()
  WHERE user_id = NEW.id AND milestone_type = 'onboarding_complete' AND completed = false;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_phase_visibility()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN UPDATE phases SET visible_tier_ids = NEW.visible_tier_ids WHERE course_id = NEW.id; RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.sync_task_visibility()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  UPDATE tasks t SET visible_tier_ids = c.visible_tier_ids
  FROM phases p JOIN courses c ON p.course_id = c.id
  WHERE t.phase_id = NEW.id AND p.id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_user_coach_assignment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_coach uuid;
BEGIN
  IF NEW.assigned_to IS NULL THEN
    SELECT coach_id INTO v_coach FROM public.user_review_assignments WHERE user_id = NEW.user_id AND active = true LIMIT 1;
    IF v_coach IS NOT NULL THEN NEW.assigned_to := v_coach; NEW.assigned_at := now(); END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_phase_unlocked(_phase_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _phase RECORD; _user_created_at TIMESTAMPTZ; _delay_days INTEGER;
  _required_task_id UUID; _required_phase_id UUID; _is_completed BOOLEAN; _quiz_completed BOOLEAN;
BEGIN
  SELECT * INTO _phase FROM phases WHERE id = _phase_id AND is_active = true;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  SELECT created_at INTO _user_created_at FROM user_profiles WHERE id = _user_id;
  IF _user_created_at IS NULL THEN RETURN FALSE; END IF;
  CASE _phase.unlock_type
    WHEN 'time' THEN
      _delay_days := COALESCE((_phase.unlock_condition->>'delay_days')::INTEGER, 0);
      _is_completed := CURRENT_DATE >= (_user_created_at::DATE + _delay_days);
    WHEN 'previous_task' THEN
      _required_task_id := (_phase.unlock_condition->>'task_id')::UUID;
      IF _required_task_id IS NOT NULL THEN
        SELECT EXISTS(SELECT 1 FROM task_responses WHERE user_id = _user_id AND task_id = _required_task_id AND status = 'completed') INTO _is_completed;
        _is_completed := COALESCE(_is_completed, FALSE);
      ELSE _is_completed := TRUE; END IF;
    WHEN 'completion' THEN
      _required_phase_id := (_phase.unlock_condition->>'phase_id')::UUID;
      IF _required_phase_id IS NOT NULL THEN
        SELECT NOT EXISTS(
          SELECT 1 FROM tasks t WHERE t.phase_id = _required_phase_id AND t.is_active = true
            AND NOT EXISTS(SELECT 1 FROM task_responses tr WHERE tr.task_id = t.id AND tr.user_id = _user_id AND tr.status = 'completed')
        ) INTO _is_completed;
        _is_completed := COALESCE(_is_completed, FALSE);
      ELSE _is_completed := TRUE; END IF;
    ELSE _is_completed := TRUE;
  END CASE;
  IF NOT _is_completed THEN RETURN FALSE; END IF;
  _quiz_completed := is_phase_quiz_completed(_phase_id, _user_id);
  RETURN _is_completed AND _quiz_completed;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_task_unlocked(_task_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _task RECORD; _phase RECORD; _task_unlock_strategy TEXT; _previous_task_id UUID; _is_completed BOOLEAN;
BEGIN
  SELECT * INTO _task FROM tasks WHERE id = _task_id AND is_active = true;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  SELECT * INTO _phase FROM phases WHERE id = _task.phase_id AND is_active = true;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF NOT is_phase_unlocked(_task.phase_id, _user_id) THEN RETURN FALSE; END IF;
  _task_unlock_strategy := COALESCE((_phase.unlock_condition->>'task_unlock_strategy')::TEXT, 'all_at_once');
  IF _task_unlock_strategy = 'all_at_once' THEN RETURN TRUE; END IF;
  IF _task_unlock_strategy = 'sequential' THEN
    SELECT id INTO _previous_task_id FROM tasks WHERE phase_id = _task.phase_id AND is_active = true AND task_order < _task.task_order ORDER BY task_order DESC LIMIT 1;
    IF _previous_task_id IS NULL THEN RETURN TRUE; END IF;
    SELECT EXISTS(SELECT 1 FROM task_responses WHERE user_id = _user_id AND task_id = _previous_task_id AND status = 'completed') INTO _is_completed;
    RETURN COALESCE(_is_completed, FALSE);
  END IF;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_phase_quiz_completed(_phase_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _required_quiz_id uuid; _passing_grade numeric; _user_passed boolean;
BEGIN
  SELECT pqr.quiz_id, q.passing_grade INTO _required_quiz_id, _passing_grade
  FROM phase_quiz_requirements pqr JOIN quizzes q ON q.id = pqr.quiz_id
  WHERE pqr.phase_id = _phase_id AND pqr.is_required = true AND q.is_active = true LIMIT 1;
  IF _required_quiz_id IS NULL THEN RETURN true; END IF;
  SELECT EXISTS(SELECT 1 FROM quiz_submissions WHERE quiz_id = _required_quiz_id AND user_id = _user_id AND passed = true AND score >= _passing_grade) INTO _user_passed;
  RETURN COALESCE(_user_passed, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.check_phase_base_conditions(_phase_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE phase_record phases%ROWTYPE; user_created_at timestamptz; delay_days integer; required_phase_id uuid; required_task_id uuid;
BEGIN
  SELECT * INTO phase_record FROM phases WHERE id = _phase_id;
  IF NOT FOUND THEN RETURN false; END IF;
  delay_days := COALESCE((phase_record.unlock_condition->>'delay_days')::int, phase_record.unlock_delay_days, 0);
  required_phase_id := COALESCE((phase_record.unlock_condition->>'phase_id')::uuid, phase_record.required_phase_id);
  required_task_id := (phase_record.unlock_condition->>'task_id')::uuid;
  CASE phase_record.unlock_type
    WHEN 'immediate' THEN RETURN true;
    WHEN 'time' THEN
      SELECT created_at INTO user_created_at FROM auth.users WHERE id = _user_id;
      IF user_created_at IS NULL THEN RETURN false; END IF;
      RETURN CURRENT_DATE >= (user_created_at::date + delay_days);
    WHEN 'completion' THEN
      IF required_phase_id IS NULL THEN RETURN false; END IF;
      RETURN NOT EXISTS (SELECT 1 FROM tasks t WHERE t.phase_id = required_phase_id AND t.is_active = true AND NOT EXISTS (SELECT 1 FROM task_responses tr WHERE tr.task_id = t.id AND tr.user_id = _user_id AND tr.status = 'completed'));
    WHEN 'previous_task' THEN
      IF required_task_id IS NULL THEN RETURN true; END IF;
      RETURN EXISTS (SELECT 1 FROM task_responses tr WHERE tr.task_id = required_task_id AND tr.user_id = _user_id AND tr.status = 'completed');
    ELSE RETURN true;
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_login_streak(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_last_login_date DATE; v_current_streak INTEGER; v_longest_streak INTEGER; v_total_logins INTEGER;
BEGIN
  SELECT last_login_date, current_streak, longest_streak, total_logins INTO v_last_login_date, v_current_streak, v_longest_streak, v_total_logins FROM user_login_streaks WHERE user_id = p_user_id;
  IF v_last_login_date IS NULL THEN
    INSERT INTO user_login_streaks (user_id, current_streak, longest_streak, last_login_date, total_logins) VALUES (p_user_id, 1, 1, CURRENT_DATE, 1);
    PERFORM check_and_award_achievement_badges(p_user_id); RETURN;
  END IF;
  IF v_last_login_date = CURRENT_DATE THEN RETURN; END IF;
  IF v_last_login_date = CURRENT_DATE - 1 THEN
    v_current_streak := v_current_streak + 1; v_longest_streak := GREATEST(v_longest_streak, v_current_streak);
  ELSIF v_last_login_date < CURRENT_DATE - 1 THEN v_current_streak := 1; END IF;
  UPDATE user_login_streaks SET current_streak = v_current_streak, longest_streak = v_longest_streak, last_login_date = CURRENT_DATE, total_logins = v_total_logins + 1, updated_at = now() WHERE user_id = p_user_id;
  PERFORM check_and_award_achievement_badges(p_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.check_and_award_achievement_badges(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_badge RECORD; v_completed_tasks INTEGER; v_total_tasks INTEGER;
  v_trade_count INTEGER; v_green_days INTEGER; v_quiz_passed_count INTEGER; v_completion_percent NUMERIC;
BEGIN
  SELECT COUNT(*) INTO v_completed_tasks FROM task_responses WHERE user_id = p_user_id AND status = 'completed';
  SELECT COUNT(*) INTO v_total_tasks FROM tasks WHERE is_active = true;
  SELECT COUNT(*) INTO v_trade_count FROM trade_records WHERE user_id = p_user_id;
  SELECT COUNT(DISTINCT trade_date) INTO v_green_days FROM trade_records WHERE user_id = p_user_id AND total_profit > 0;
  SELECT COUNT(*) INTO v_quiz_passed_count FROM quiz_submissions WHERE user_id = p_user_id AND passed = true;
  FOR v_badge IN SELECT * FROM achievement_badges WHERE auto_award = true AND is_active = true LOOP
    CASE v_badge.requirement_type
      WHEN 'task_completion_percent' THEN
        IF v_total_tasks > 0 THEN
          v_completion_percent := (v_completed_tasks::NUMERIC / v_total_tasks::NUMERIC) * 100;
          IF v_completion_percent >= (v_badge.requirement_value->>'percent')::NUMERIC THEN
            INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
          END IF;
        END IF;
      WHEN 'first_login' THEN INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
      WHEN 'onboarding_complete' THEN
        IF EXISTS (SELECT 1 FROM user_milestones WHERE user_id = p_user_id AND milestone_type = 'onboarding_complete' AND completed = true) THEN
          INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;
      WHEN 'first_trade' THEN IF v_trade_count >= 1 THEN INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING; END IF;
      WHEN 'trade_count' THEN IF v_trade_count >= (v_badge.requirement_value->>'count')::INTEGER THEN INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING; END IF;
      WHEN 'green_day' THEN IF v_green_days >= (v_badge.requirement_value->>'days')::INTEGER THEN INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING; END IF;
      WHEN 'quiz_passed' THEN IF v_quiz_passed_count >= (v_badge.requirement_value->>'count')::INTEGER THEN INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING; END IF;
      WHEN 'login_streak' THEN
        IF EXISTS (SELECT 1 FROM user_login_streaks WHERE user_id = p_user_id AND current_streak >= (v_badge.requirement_value->>'days')::INTEGER) THEN
          INSERT INTO user_achievement_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;
    END CASE;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_points_for_task(p_task_id uuid, p_points integer, p_description text, p_activity_type text DEFAULT 'task_completion')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_user_id uuid := auth.uid(); v_exists boolean; v_id uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  PERFORM 1 FROM task_responses WHERE user_id = v_user_id AND task_id = p_task_id AND status = 'completed' LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Task not completed yet'; END IF;
  SELECT EXISTS(SELECT 1 FROM user_points WHERE user_id = v_user_id AND activity_type = p_activity_type AND activity_description = p_description) INTO v_exists;
  IF v_exists THEN RETURN NULL; END IF;
  INSERT INTO user_points (user_id, points, activity_type, activity_description) VALUES (v_user_id, p_points, p_activity_type, p_description) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_leaderboard_cache()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.leaderboard_cache;
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

CREATE OR REPLACE FUNCTION public.get_tier_leaderboard(p_tier_id uuid)
RETURNS TABLE(user_id uuid, first_name text, last_name text, user_email text, total_points integer, rank integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH user_activity_points AS (SELECT up.user_id, COALESCE(SUM(up.points), 0) as points FROM public.user_points up JOIN public.user_profiles prof ON prof.id = up.user_id WHERE prof.tier_id = p_tier_id GROUP BY up.user_id),
  user_achievement_points AS (SELECT uab.user_id, COALESCE(SUM(ab.points_value), 0) as points FROM public.user_achievement_badges uab JOIN public.achievement_badges ab ON ab.id = uab.badge_id JOIN public.user_profiles prof ON prof.id = uab.user_id WHERE prof.tier_id = p_tier_id GROUP BY uab.user_id),
  user_habit_points AS (SELECT uhb.user_id, COALESCE(SUM(hb.points_value), 0) as points FROM public.user_habit_badges uhb JOIN public.habit_badges hb ON hb.id = uhb.badge_id JOIN public.user_profiles prof ON prof.id = uhb.user_id WHERE prof.tier_id = p_tier_id GROUP BY uhb.user_id),
  tier_users AS (SELECT id as user_id FROM public.user_profiles WHERE tier_id = p_tier_id AND is_active = true)
  SELECT tu.user_id, prof.first_name, prof.last_name, prof.user_email,
    (COALESCE(uap.points, 0) + COALESCE(uachp.points, 0) + COALESCE(uhp.points, 0))::INTEGER as total_points,
    ROW_NUMBER() OVER (ORDER BY (COALESCE(uap.points, 0) + COALESCE(uachp.points, 0) + COALESCE(uhp.points, 0)) DESC)::INTEGER as rank
  FROM tier_users tu
  JOIN public.user_profiles prof ON prof.id = tu.user_id
  LEFT JOIN user_activity_points uap ON uap.user_id = tu.user_id
  LEFT JOIN user_achievement_points uachp ON uachp.user_id = tu.user_id
  LEFT JOIN user_habit_points uhp ON uhp.user_id = tu.user_id
  WHERE (COALESCE(uap.points, 0) + COALESCE(uachp.points, 0) + COALESCE(uhp.points, 0)) > 0
  ORDER BY rank LIMIT 100;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_users_with_progress(
  p_page integer DEFAULT 1, p_per_page integer DEFAULT 15, p_search text DEFAULT '',
  p_tier_ids uuid[] DEFAULT NULL, p_role_id uuid DEFAULT NULL, p_store_filter text DEFAULT 'all',
  p_course_ids uuid[] DEFAULT NULL, p_sort_column text DEFAULT 'created_at', p_sort_direction text DEFAULT 'desc',
  p_invitation_filter text DEFAULT 'all'
)
RETURNS TABLE(id uuid, email text, first_name text, last_name text, tier text, tier_id uuid, role text, role_id uuid, is_active boolean, total_tasks integer, completed_tasks integer, progress_percentage integer, created_at timestamptz, store_activated boolean, store_url text, shopify_shop_name text, last_sign_in_at timestamptz, total_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_offset integer := GREATEST((p_page - 1) * p_per_page, 0); v_sort_dir text := LOWER(COALESCE(p_sort_direction, 'desc'));
BEGIN
  RETURN QUERY
  WITH total_active_tasks AS (SELECT COUNT(*)::int AS cnt FROM public.tasks tsk WHERE COALESCE(tsk.is_active, true) = true),
  task_stats AS (SELECT tr.user_id, COUNT(*) FILTER (WHERE tr.status = 'completed')::int AS completed_count FROM public.task_responses tr GROUP BY tr.user_id),
  base AS (
    SELECT up.id, COALESCE(up.user_email, '')::text AS email, up.first_name, up.last_name, up.tier_id, up.role_id, up.is_active, up.created_at,
      COALESCE(up.store_activated, false) AS store_activated, up.store_url, up.shopify_shop_name,
      COALESCE(ts.completed_count, 0) AS completed_tasks, tat.cnt AS total_tasks,
      COALESCE(ROUND((COALESCE(ts.completed_count, 0)::numeric / NULLIF(tat.cnt, 0)::numeric) * 100), 0)::int AS progress_percentage,
      COALESCE(ti.display_name, '')::text AS tier_name, COALESCE(ro.display_name, '')::text AS role_name,
      au.last_sign_in_at, COUNT(*) OVER() AS total_count
    FROM public.user_profiles up CROSS JOIN total_active_tasks tat
    LEFT JOIN task_stats ts ON ts.user_id = up.id
    LEFT JOIN public.tiers ti ON ti.id = up.tier_id
    LEFT JOIN public.roles ro ON ro.id = up.role_id
    LEFT JOIN auth.users au ON au.id = up.id
    WHERE (p_search = '' OR (COALESCE(up.user_email, '') ILIKE '%' || p_search || '%' OR COALESCE(up.first_name, '') ILIKE '%' || p_search || '%' OR COALESCE(up.last_name, '') ILIKE '%' || p_search || '%'))
      AND (p_tier_ids IS NULL OR up.tier_id = ANY(p_tier_ids))
      AND (p_role_id IS NULL OR up.role_id = p_role_id)
      AND (p_store_filter = 'all' OR (p_store_filter = 'activated' AND COALESCE(up.store_activated, false) = true) OR (p_store_filter = 'not_activated' AND COALESCE(up.store_activated, false) = false))
      AND (p_course_ids IS NULL OR EXISTS (SELECT 1 FROM public.user_course_access uca WHERE uca.user_id = up.id AND uca.course_id = ANY(p_course_ids)))
      AND (p_invitation_filter = 'all' OR (p_invitation_filter = 'confirmed' AND au.last_sign_in_at IS NOT NULL) OR (p_invitation_filter = 'pending' AND au.last_sign_in_at IS NULL))
  )
  SELECT base.id, base.email, base.first_name, base.last_name, base.tier_name, base.tier_id, base.role_name, base.role_id,
    base.is_active, base.total_tasks, base.completed_tasks, base.progress_percentage, base.created_at, base.store_activated, base.store_url, base.shopify_shop_name, base.last_sign_in_at, base.total_count
  FROM base
  ORDER BY
    CASE WHEN p_sort_column = 'name' AND v_sort_dir = 'asc' THEN base.first_name END ASC NULLS LAST,
    CASE WHEN p_sort_column = 'name' AND v_sort_dir = 'desc' THEN base.first_name END DESC NULLS LAST,
    CASE WHEN p_sort_column IN ('created_at', 'joinedDate') AND v_sort_dir = 'asc' THEN base.created_at END ASC NULLS LAST,
    CASE WHEN p_sort_column IN ('created_at', 'joinedDate') AND v_sort_dir = 'desc' THEN base.created_at END DESC NULLS LAST,
    CASE WHEN p_sort_column IN ('progress', 'progress_percentage') AND v_sort_dir = 'asc' THEN base.progress_percentage END ASC NULLS LAST,
    CASE WHEN p_sort_column IN ('progress', 'progress_percentage') AND v_sort_dir = 'desc' THEN base.progress_percentage END DESC NULLS LAST,
    CASE WHEN p_sort_column = 'tier' AND v_sort_dir = 'asc' THEN base.tier_name END ASC NULLS LAST,
    CASE WHEN p_sort_column = 'tier' AND v_sort_dir = 'desc' THEN base.tier_name END DESC NULLS LAST,
    CASE WHEN p_sort_column = 'invitation' AND v_sort_dir = 'asc' THEN (base.last_sign_in_at IS NOT NULL) END ASC,
    CASE WHEN p_sort_column = 'invitation' AND v_sort_dir = 'desc' THEN (base.last_sign_in_at IS NOT NULL) END DESC,
    base.created_at DESC NULLS LAST, base.id ASC
  LIMIT p_per_page OFFSET v_offset;
END;
$$;

-- Habit system functions
CREATE OR REPLACE FUNCTION public.seed_user_habits(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_habits (user_id, habit_name, description, order_index, is_custom, template_id, icon_name)
  SELECT p_user_id, name, description, order_index, false, id, icon_name FROM public.habit_templates WHERE is_active = true
  ON CONFLICT (user_id, habit_name) DO NOTHING;
  INSERT INTO public.habit_streaks (user_id, user_habit_id, current_streak, longest_streak, total_completions)
  SELECT p_user_id, uh.id, 0, 0, 0 FROM public.user_habits uh WHERE uh.user_id = p_user_id
  ON CONFLICT (user_id, user_habit_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_daily_habits(p_user_id uuid, p_target_date date DEFAULT CURRENT_DATE)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_count INTEGER;
BEGIN
  INSERT INTO public.habit_completions (user_id, user_habit_id, completion_date, completed)
  SELECT p_user_id, id, p_target_date, false FROM public.user_habits WHERE user_id = p_user_id AND is_active = true
  ON CONFLICT (user_id, user_habit_id, completion_date) DO NOTHING;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_habit_completion(p_user_habit_id uuid, p_user_id uuid, p_completion_date date DEFAULT CURRENT_DATE)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_completion_id UUID; v_new_completed BOOLEAN;
BEGIN
  INSERT INTO public.habit_completions (user_id, user_habit_id, completion_date, completed, skipped)
  VALUES (p_user_id, p_user_habit_id, p_completion_date, true, false)
  ON CONFLICT (user_id, user_habit_id, completion_date) DO UPDATE SET
    completed = NOT habit_completions.completed,
    completed_at = CASE WHEN NOT habit_completions.completed THEN now() ELSE NULL END,
    skipped = false, updated_at = now()
  RETURNING id, completed INTO v_completion_id, v_new_completed;
  PERFORM public.update_habit_streak(p_user_id, p_user_habit_id);
  PERFORM public.check_and_award_badges(p_user_id);
  RETURN json_build_object('id', v_completion_id, 'completed', v_new_completed, 'user_habit_id', p_user_habit_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_habit_skip(p_user_id uuid, p_user_habit_id uuid, p_completion_date date DEFAULT CURRENT_DATE)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_completion_record habit_completions%ROWTYPE; v_new_skipped boolean;
BEGIN
  SELECT * INTO v_completion_record FROM habit_completions WHERE user_id = p_user_id AND user_habit_id = p_user_habit_id AND completion_date = p_completion_date;
  IF NOT FOUND THEN
    INSERT INTO habit_completions (user_id, user_habit_id, completion_date, completed, skipped) VALUES (p_user_id, p_user_habit_id, p_completion_date, false, true) RETURNING * INTO v_completion_record;
    v_new_skipped := true;
  ELSE
    v_new_skipped := NOT COALESCE(v_completion_record.skipped, false);
    UPDATE habit_completions SET skipped = v_new_skipped, completed = CASE WHEN v_new_skipped THEN false ELSE completed END, updated_at = now() WHERE id = v_completion_record.id;
  END IF;
  RETURN json_build_object('success', true, 'skipped', v_new_skipped);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_habit_streak(p_user_id uuid, p_user_habit_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_current_streak INTEGER := 0; v_longest_streak INTEGER; v_total_completions INTEGER; v_last_date DATE; v_check_date DATE := CURRENT_DATE; v_completed BOOLEAN;
BEGIN
  LOOP
    SELECT completed INTO v_completed FROM public.habit_completions WHERE user_id = p_user_id AND user_habit_id = p_user_habit_id AND completion_date = v_check_date;
    IF NOT FOUND OR NOT v_completed THEN EXIT; END IF;
    v_current_streak := v_current_streak + 1; v_check_date := v_check_date - 1;
  END LOOP;
  SELECT COUNT(*) INTO v_total_completions FROM public.habit_completions WHERE user_id = p_user_id AND user_habit_id = p_user_habit_id AND completed = true;
  SELECT MAX(completion_date) INTO v_last_date FROM public.habit_completions WHERE user_id = p_user_id AND user_habit_id = p_user_habit_id AND completed = true;
  SELECT longest_streak INTO v_longest_streak FROM public.habit_streaks WHERE user_id = p_user_id AND user_habit_id = p_user_habit_id;
  IF v_current_streak > COALESCE(v_longest_streak, 0) THEN v_longest_streak := v_current_streak; END IF;
  INSERT INTO public.habit_streaks (user_id, user_habit_id, current_streak, longest_streak, total_completions, last_completion_date)
  VALUES (p_user_id, p_user_habit_id, v_current_streak, v_longest_streak, v_total_completions, v_last_date)
  ON CONFLICT (user_id, user_habit_id) DO UPDATE SET
    current_streak = v_current_streak, longest_streak = GREATEST(EXCLUDED.longest_streak, v_longest_streak),
    total_completions = v_total_completions, last_completion_date = v_last_date, updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_badge RECORD; v_max_streak INTEGER; v_total_completions INTEGER; v_perfect_days INTEGER;
BEGIN
  SELECT MAX(current_streak), SUM(total_completions) INTO v_max_streak, v_total_completions FROM public.habit_streaks WHERE user_id = p_user_id;
  SELECT COUNT(DISTINCT completion_date) INTO v_perfect_days FROM public.habit_completions hc
  WHERE hc.user_id = p_user_id AND hc.completed = true
    AND NOT EXISTS (SELECT 1 FROM public.habit_completions hc2 WHERE hc2.user_id = p_user_id AND hc2.completion_date = hc.completion_date AND hc2.completed = false);
  FOR v_badge IN SELECT * FROM public.habit_badges WHERE requirement_type = 'streak' AND requirement_value <= COALESCE(v_max_streak, 0) LOOP
    INSERT INTO public.user_habit_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;
  FOR v_badge IN SELECT * FROM public.habit_badges WHERE requirement_type = 'total_completions' AND requirement_value <= COALESCE(v_total_completions, 0) LOOP
    INSERT INTO public.user_habit_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;
  FOR v_badge IN SELECT * FROM public.habit_badges WHERE requirement_type = 'perfect_days' AND requirement_value <= COALESCE(v_perfect_days, 0) LOOP
    INSERT INTO public.user_habit_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_today_habits(p_user_id uuid)
RETURNS TABLE(id uuid, user_habit_id uuid, habit_name text, icon_name text, completed boolean, skipped boolean, current_streak integer, notes text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(hc.id, gen_random_uuid()), uh.id, uh.habit_name, uh.icon_name,
    COALESCE(hc.completed, false), COALESCE(hc.skipped, false), COALESCE(hs.current_streak, 0), hc.notes
  FROM user_habits uh
  LEFT JOIN habit_completions hc ON uh.id = hc.user_habit_id AND hc.completion_date = CURRENT_DATE AND hc.user_id = p_user_id
  LEFT JOIN habit_streaks hs ON uh.id = hs.user_habit_id AND hs.user_id = p_user_id
  WHERE uh.user_id = p_user_id AND uh.is_active = true ORDER BY uh.order_index;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_habit_analytics(p_user_id uuid, p_days_back integer DEFAULT 30)
RETURNS TABLE(completion_date date, total_habits integer, completed_count integer, completion_rate numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT hc.completion_date, COUNT(*)::INTEGER, SUM(CASE WHEN hc.completed THEN 1 ELSE 0 END)::INTEGER,
    ROUND((SUM(CASE WHEN hc.completed THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
  FROM public.habit_completions hc WHERE hc.user_id = p_user_id AND hc.completion_date >= CURRENT_DATE - p_days_back
  GROUP BY hc.completion_date ORDER BY hc.completion_date DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_habit_stats(p_user_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total_habits', (SELECT COUNT(*) FROM public.user_habits WHERE user_id = p_user_id AND is_active = true),
    'active_streaks', (SELECT COUNT(*) FROM public.habit_streaks WHERE user_id = p_user_id AND current_streak > 0),
    'longest_streak', (SELECT COALESCE(MAX(longest_streak), 0) FROM public.habit_streaks WHERE user_id = p_user_id),
    'total_completions', (SELECT COALESCE(SUM(total_completions), 0) FROM public.habit_streaks WHERE user_id = p_user_id),
    'badges_earned', (SELECT COUNT(*) FROM public.user_habit_badges WHERE user_id = p_user_id)
  ) INTO v_stats;
  RETURN v_stats;
END;
$$;

-- Trigger functions for badge awarding
CREATE OR REPLACE FUNCTION public.trigger_award_badges_on_task_complete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN PERFORM check_and_award_achievement_badges(NEW.user_id); END IF; RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.trigger_award_badges_on_trade_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN PERFORM check_and_award_achievement_badges(NEW.user_id); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.trigger_award_badges_on_milestone()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN PERFORM check_and_award_achievement_badges(NEW.user_id); END IF; RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.trigger_award_badges_on_quiz()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN IF NEW.passed = true THEN PERFORM check_and_award_achievement_badges(NEW.user_id); END IF; RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_phase_deletion_quiz_cascade()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $$
DECLARE prev_phase_id UUID;
BEGIN
  SELECT id INTO prev_phase_id FROM phases WHERE course_id = OLD.course_id AND phase_order < OLD.phase_order AND is_active = true ORDER BY phase_order DESC LIMIT 1;
  IF prev_phase_id IS NOT NULL THEN UPDATE quizzes SET linked_phase_id = prev_phase_id WHERE linked_phase_id = OLD.id;
  ELSE
    SELECT id INTO prev_phase_id FROM phases WHERE course_id = OLD.course_id AND is_active = true AND id != OLD.id ORDER BY phase_order ASC LIMIT 1;
    IF prev_phase_id IS NOT NULL THEN UPDATE quizzes SET linked_phase_id = prev_phase_id WHERE linked_phase_id = OLD.id;
    ELSE DELETE FROM quizzes WHERE linked_phase_id = OLD.id; END IF;
  END IF;
  RETURN OLD;
END;
$$;

-- ============================================================================
-- 9. TRIGGERS
-- ============================================================================

-- updated_at triggers
CREATE TRIGGER handle_updated_at_announcements BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_updated_at_app_config BEFORE UPDATE ON public.app_config FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_updated_at_app_version BEFORE UPDATE ON public.app_version FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_updated_at_calendar_calls BEFORE UPDATE ON public.calendar_calls FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_updated_at_call_recordings BEFORE UPDATE ON public.call_recordings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_updated_at_coaches BEFORE UPDATE ON public.coaches FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_community_channels_updated_at BEFORE UPDATE ON public.community_channels FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_community_dm_conversations_updated_at BEFORE UPDATE ON public.community_dm_conversations FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_community_messages_updated_at BEFORE UPDATE ON public.community_messages FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_community_user_channel_settings_updated_at BEFORE UPDATE ON public.community_user_channel_settings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_updated_at_courses BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_updated_at_daily_reviews BEFORE UPDATE ON public.daily_reviews FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_updated_at_habit_completions BEFORE UPDATE ON public.habit_completions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_updated_at_phases BEFORE UPDATE ON public.phases FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_updated_at_quiz_questions BEFORE UPDATE ON public.quiz_questions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_updated_at_quizzes BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_updated_at_roles BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_updated_at_tasks BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_updated_at_task_responses BEFORE UPDATE ON public.task_responses FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_updated_at_tiers BEFORE UPDATE ON public.tiers FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_updated_at_trade_records BEFORE UPDATE ON public.trade_records FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_updated_at_trading_accounts BEFORE UPDATE ON public.trading_accounts FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_updated_at_user_habits BEFORE UPDATE ON public.user_habits FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_updated_at_user_profiles BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- update_updated_at_column triggers (alternate naming)
CREATE TRIGGER update_daily_ad_entries_updated_at BEFORE UPDATE ON public.daily_ad_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facebook_ad_connections_updated_at BEFORE UPDATE ON public.facebook_ad_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facebook_ad_metrics_updated_at BEFORE UPDATE ON public.facebook_ad_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Business logic triggers
CREATE TRIGGER tr_add_admins_to_dm AFTER INSERT ON public.community_dm_conversations FOR EACH ROW EXECUTE FUNCTION add_admins_to_new_dm();
CREATE TRIGGER sync_phase_visibility_on_course_update AFTER UPDATE OF visible_tier_ids ON public.courses FOR EACH ROW EXECUTE FUNCTION sync_phase_visibility();
CREATE TRIGGER sync_task_visibility_on_phase_update AFTER INSERT OR UPDATE ON public.phases FOR EACH ROW EXECUTE FUNCTION sync_task_visibility();
CREATE TRIGGER handle_phase_deletion_quiz_cascade_trigger BEFORE DELETE ON public.phases FOR EACH ROW EXECUTE FUNCTION handle_phase_deletion_quiz_cascade();

-- Badge awarding triggers
CREATE TRIGGER award_badges_after_task_complete AFTER INSERT OR UPDATE ON public.task_responses FOR EACH ROW EXECUTE FUNCTION trigger_award_badges_on_task_complete();
CREATE TRIGGER award_badges_after_trade_log AFTER INSERT ON public.trade_records FOR EACH ROW EXECUTE FUNCTION trigger_award_badges_on_trade_log();
CREATE TRIGGER award_badges_after_milestone AFTER UPDATE ON public.user_milestones FOR EACH ROW EXECUTE FUNCTION trigger_award_badges_on_milestone();
CREATE TRIGGER award_badges_after_quiz_pass AFTER INSERT ON public.quiz_submissions FOR EACH ROW EXECUTE FUNCTION trigger_award_badges_on_quiz();

-- Auth-related triggers
CREATE TRIGGER set_user_id_on_task_response BEFORE INSERT ON public.task_responses FOR EACH ROW EXECUTE FUNCTION set_user_id_from_auth();
CREATE TRIGGER set_user_id_on_trade_record BEFORE INSERT ON public.trade_records FOR EACH ROW EXECUTE FUNCTION set_user_id_from_auth();
CREATE TRIGGER set_trader_profile_id BEFORE INSERT ON public.trader_profiles FOR EACH ROW EXECUTE FUNCTION set_trader_profile_id_from_auth();
CREATE TRIGGER apply_coach_assignment_on_trade_insert BEFORE INSERT ON public.trade_records FOR EACH ROW EXECUTE FUNCTION apply_user_coach_assignment();

-- Profile sync trigger
CREATE TRIGGER trg_sync_user_public_profile AFTER INSERT OR UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION sync_user_public_profile();

-- ============================================================================
-- 10. AUTH TRIGGERS (on auth.users - run ONLY if setting up fresh Supabase)
-- ============================================================================
-- NOTE: These triggers attach to auth.users which is managed by Supabase.
-- On a fresh project, you need to create these manually:
--
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
--
-- CREATE TRIGGER on_auth_mega_admin_signup
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_mega_admin_signup();

-- ============================================================================
-- 11. STORAGE BUCKETS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('task-submissions', 'task-submissions', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('review-screenshots', 'review-screenshots', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('course-videos', 'course-videos', true) ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Avatars are publicly viewable" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete their own avatars" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Admins can upload coach avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'coaches' AND is_admin(auth.uid()));

CREATE POLICY "Task submissions are publicly viewable" ON storage.objects FOR SELECT USING (bucket_id = 'task-submissions');
CREATE POLICY "Users can upload task submissions" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'task-submissions' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete their own task submissions" ON storage.objects FOR DELETE USING (bucket_id = 'task-submissions' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Review screenshots are publicly viewable" ON storage.objects FOR SELECT USING (bucket_id = 'review-screenshots');
CREATE POLICY "Users can upload review screenshots" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'review-screenshots' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete their own review screenshots" ON storage.objects FOR DELETE USING (bucket_id = 'review-screenshots' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Chat attachments are publicly viewable" ON storage.objects FOR SELECT USING (bucket_id = 'chat-attachments');
CREATE POLICY "Users can upload chat attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Course videos are publicly viewable" ON storage.objects FOR SELECT USING (bucket_id = 'course-videos');
CREATE POLICY "Admins can upload course videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'course-videos' AND is_admin(auth.uid()));
CREATE POLICY "Admins can update course videos" ON storage.objects FOR UPDATE USING (bucket_id = 'course-videos' AND is_admin(auth.uid()));
CREATE POLICY "Admins can delete course videos" ON storage.objects FOR DELETE USING (bucket_id = 'course-videos' AND is_admin(auth.uid()));

-- ============================================================================
-- 12. EDGE FUNCTIONS REFERENCE (code lives in supabase/functions/)
-- ============================================================================
-- The following edge functions are configured in supabase/config.toml:
--
-- Function Name                      | verify_jwt
-- -----------------------------------|----------
-- get-trade-reviews                  | true
-- generate-crisp-token               | true
-- generate-impersonation-link        | true
-- get-user-detail                    | true
-- generate-weekly-report             | false
-- chat-completion                    | false
-- analyze-chart                      | false
-- create-user                        | false
-- list-users                         | false
-- reset-password                     | false
-- send-to-n8n-agent                  | true
-- send-to-n8n-agent-market-maker     | true
-- invite-user                        | false
-- get-course-detail                  | true
-- update-user-tier                   | false
-- delete-user                        | false
-- migrate-google-drive-videos        | false
-- migrate-video-links                | false
-- get-dashboard-metrics              | true
-- send-push-notification             | false
-- facebook-oauth-callback            | false
-- sync-facebook-ads                  | true
-- get-facebook-ad-accounts           | true
-- facebook-deauthorize               | false
-- facebook-data-deletion             | false
-- scrape-shopify-product             | true
-- shopify-oauth-start                | true
-- shopify-oauth-callback             | false
-- shopify-check-status               | true
-- shopify-fetch-products             | true
-- shopify-disconnect                 | true
-- get-video-metadata                 | false
-- upsert-user                        | false
-- moderate-message                   | false
-- update-user-password               | false
--
-- Edge function source code is in supabase/functions/<function-name>/index.ts

-- ============================================================================
-- END OF SCHEMA EXPORT
-- ============================================================================

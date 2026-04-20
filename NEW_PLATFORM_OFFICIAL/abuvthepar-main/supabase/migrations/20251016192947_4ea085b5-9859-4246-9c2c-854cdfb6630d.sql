-- Complete Habit Tracker Removal Migration
-- Drop all habit-related triggers, views, functions, and tables

-- 1. Drop triggers from user_profiles
DROP TRIGGER IF EXISTS trg_seed_habits_on_profile_creation ON public.user_profiles;
DROP TRIGGER IF EXISTS trigger_seed_habits_on_profile_creation ON public.user_profiles;

-- 2. Drop the view
DROP VIEW IF EXISTS public.user_habit_items_v CASCADE;

-- 3. Drop all habit-related functions
DROP FUNCTION IF EXISTS public.assign_and_get_daily_habits(uuid, date) CASCADE;
DROP FUNCTION IF EXISTS public.assign_daily_habits(uuid, date) CASCADE;
DROP FUNCTION IF EXISTS public.get_habit_completion_summary(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_overdue_habits_with_tasks(uuid, date) CASCADE;
DROP FUNCTION IF EXISTS public.reset_user_habits_to_defaults(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.seed_user_default_habits(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.seed_habits_on_profile_creation() CASCADE;

-- 4. Drop tables in dependency order
DROP TABLE IF EXISTS public.user_habit_completions CASCADE;
DROP TABLE IF EXISTS public.user_custom_habits CASCADE;
DROP TABLE IF EXISTS public.habit_tracker_tasks CASCADE;
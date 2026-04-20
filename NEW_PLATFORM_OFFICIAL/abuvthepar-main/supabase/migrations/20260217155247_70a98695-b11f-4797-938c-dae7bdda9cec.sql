-- Drop tables for removed modules
-- Order matters due to foreign key constraints

-- AI Profit Assistant
DROP TABLE IF EXISTS public.ai_chat_messages CASCADE;
DROP TABLE IF EXISTS public.ai_chat_sessions CASCADE;
DROP TABLE IF EXISTS public.notebook_entries CASCADE;
DROP TABLE IF EXISTS public.chat_sessions CASCADE;

-- Coaches
DROP TABLE IF EXISTS public.coaches CASCADE;

-- Daily Tracker
DROP TABLE IF EXISTS public.daily_ad_entries CASCADE;

-- Facebook Ads
DROP TABLE IF EXISTS public.facebook_ad_metrics CASCADE;
DROP TABLE IF EXISTS public.facebook_ad_connections CASCADE;

-- UGC Creator
DROP TABLE IF EXISTS public.ugc_video_generations CASCADE;
DROP TABLE IF EXISTS public.ugc_video_credits CASCADE;
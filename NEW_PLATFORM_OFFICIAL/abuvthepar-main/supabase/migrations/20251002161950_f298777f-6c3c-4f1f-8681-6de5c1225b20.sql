-- Step 1: Extend app_role enum to include client tiers
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client_stb';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client_midticket';
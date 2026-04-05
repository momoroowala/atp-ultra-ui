-- First migration: Just add the enum value
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'mega_admin';
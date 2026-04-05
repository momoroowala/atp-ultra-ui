-- Add metadata columns to user_milestones table
ALTER TABLE public.user_milestones
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS action_label TEXT,
ADD COLUMN IF NOT EXISTS icon_name TEXT DEFAULT 'Trophy';
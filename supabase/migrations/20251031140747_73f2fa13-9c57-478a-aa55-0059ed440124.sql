-- Create calendar_calls table
CREATE TABLE public.calendar_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  call_date DATE NOT NULL,
  call_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  call_link TEXT NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  created_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  visible_tiers TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create call_recordings table
CREATE TABLE public.call_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  recording_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_minutes INTEGER,
  recorded_date DATE NOT NULL,
  recorded_time TIME,
  tags TEXT[] DEFAULT '{}',
  additional_links JSONB,
  created_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  visible_tiers TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_calls

-- Users can view calls where visible_tiers is NULL OR their tier is in the array OR they are admin
CREATE POLICY "Users can view accessible calls"
ON public.calendar_calls
FOR SELECT
TO authenticated
USING (
  is_active = true AND (
    -- Admin, mega_admin, or operations can see all
    is_admin(auth.uid()) OR
    -- visible_tiers is NULL or empty means visible to all
    visible_tiers IS NULL OR
    array_length(visible_tiers, 1) IS NULL OR
    -- User's tier is in visible_tiers
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND tier = ANY(visible_tiers)
    )
  )
);

-- Only admins and operations can insert calls
CREATE POLICY "Admins can insert calls"
ON public.calendar_calls
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- Only admins and operations can update calls
CREATE POLICY "Admins can update calls"
ON public.calendar_calls
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

-- Only admins and operations can delete calls
CREATE POLICY "Admins can delete calls"
ON public.calendar_calls
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- RLS Policies for call_recordings

-- Users can view recordings where visible_tiers is NULL OR their tier is in the array OR they are admin
CREATE POLICY "Users can view accessible recordings"
ON public.call_recordings
FOR SELECT
TO authenticated
USING (
  is_active = true AND (
    -- Admin, mega_admin, or operations can see all
    is_admin(auth.uid()) OR
    -- visible_tiers is NULL or empty means visible to all
    visible_tiers IS NULL OR
    array_length(visible_tiers, 1) IS NULL OR
    -- User's tier is in visible_tiers
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND tier = ANY(visible_tiers)
    )
  )
);

-- Only admins and operations can insert recordings
CREATE POLICY "Admins can insert recordings"
ON public.call_recordings
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- Only admins and operations can update recordings
CREATE POLICY "Admins can update recordings"
ON public.call_recordings
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

-- Only admins and operations can delete recordings
CREATE POLICY "Admins can delete recordings"
ON public.call_recordings
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_calendar_calls_updated_at
BEFORE UPDATE ON public.calendar_calls
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_call_recordings_updated_at
BEFORE UPDATE ON public.call_recordings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
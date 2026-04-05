-- Create coaches table
CREATE TABLE public.coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  booking_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

-- Admins can manage coaches
CREATE POLICY "Admins can manage coaches"
ON public.coaches
FOR ALL
USING (is_admin(auth.uid()));

-- All authenticated users can view active coaches
CREATE POLICY "Users can view active coaches"
ON public.coaches
FOR SELECT
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_coaches_updated_at
BEFORE UPDATE ON public.coaches
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
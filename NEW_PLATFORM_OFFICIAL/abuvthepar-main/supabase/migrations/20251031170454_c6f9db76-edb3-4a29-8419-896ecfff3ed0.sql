-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  role_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for roles
CREATE POLICY "Anyone can view active roles"
  ON public.roles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Mega admins can manage roles"
  ON public.roles FOR ALL
  USING (has_role(auth.uid(), 'mega_admin'::app_role));

-- Insert default roles
INSERT INTO public.roles (role_key, display_name, description, role_order) VALUES
  ('client', 'Client', 'Standard client user', 1),
  ('admin', 'Admin', 'Administrator with elevated permissions', 2),
  ('mega_admin', 'Mega Admin', 'Super administrator with full access', 3)
ON CONFLICT (role_key) DO NOTHING;

-- Add role_id column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id);

-- Migrate existing data from user_roles to user_profiles
UPDATE public.user_profiles up
SET role_id = (
  SELECT r.id FROM public.roles r
  WHERE r.role_key = (
    SELECT ur.role::text 
    FROM public.user_roles ur 
    WHERE ur.user_id = up.id 
    AND ur.role IN ('admin', 'mega_admin')
    LIMIT 1
  )
)
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = up.id 
  AND ur.role IN ('admin', 'mega_admin')
);

-- Set default role_id to 'client' for users without a role
UPDATE public.user_profiles up
SET role_id = (SELECT id FROM public.roles WHERE role_key = 'client')
WHERE role_id IS NULL;

-- Make role_id NOT NULL after migration
ALTER TABLE public.user_profiles 
ALTER COLUMN role_id SET NOT NULL;

-- Add is_active column to user_profiles for deactivation
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create updated_at trigger for roles
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create helper function to check role by role_key
CREATE OR REPLACE FUNCTION public.has_role_key(_user_id uuid, _role_key text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    JOIN public.roles r ON r.id = up.role_id
    WHERE up.id = _user_id
      AND r.role_key = _role_key
      AND up.is_active = true
  )
$$;

-- Update is_admin function to use new role structure
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    JOIN public.roles r ON r.id = up.role_id
    WHERE up.id = _user_id
      AND r.role_key IN ('admin', 'mega_admin')
      AND up.is_active = true
  )
$$;
-- Now create the mega admin setup
-- Create trigger function to auto-assign mega admin role
CREATE OR REPLACE FUNCTION public.handle_mega_admin_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if this is the mega admin email
  IF NEW.email = 'jesserogers@smarttradingblueprint.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'mega_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run on user creation
DROP TRIGGER IF EXISTS on_mega_admin_signup ON auth.users;
CREATE TRIGGER on_mega_admin_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_mega_admin_signup();

-- Create function to check if user is admin or mega_admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'mega_admin')
  )
$$;
-- Add user_email column to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Create index on user_email for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(user_email);

-- Update the handle_new_user trigger function to capture email and names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, 
    user_email,
    first_name, 
    last_name,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.created_at, 
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    user_email = EXCLUDED.user_email,
    first_name = COALESCE(EXCLUDED.first_name, user_profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, user_profiles.last_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Backfill existing user_profiles with email and names from auth.users
UPDATE public.user_profiles up
SET 
  user_email = au.email,
  first_name = COALESCE(up.first_name, au.raw_user_meta_data->>'first_name'),
  last_name = COALESCE(up.last_name, au.raw_user_meta_data->>'last_name'),
  updated_at = NOW()
FROM auth.users au
WHERE up.id = au.id
  AND (up.user_email IS NULL OR up.first_name IS NULL OR up.last_name IS NULL);

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.user_email IS 'User email address synced from auth.users';
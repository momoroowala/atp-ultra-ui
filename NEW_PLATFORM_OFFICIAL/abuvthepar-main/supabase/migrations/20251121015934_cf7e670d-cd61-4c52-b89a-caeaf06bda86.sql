-- Enable RLS on app_version if not already enabled
ALTER TABLE app_version ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to insert new versions
CREATE POLICY "Admins can insert app versions"
ON app_version
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin(auth.uid())
);

-- Create policy to allow everyone to read versions
CREATE POLICY "Anyone can read app versions"
ON app_version
FOR SELECT
TO authenticated
USING (true);
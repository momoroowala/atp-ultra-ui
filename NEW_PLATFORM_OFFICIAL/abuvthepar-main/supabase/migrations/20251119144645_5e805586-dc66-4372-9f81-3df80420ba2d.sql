-- Create app_version table
CREATE TABLE IF NOT EXISTS public.app_version (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL DEFAULT '1.0.0',
  message text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Ensure only one row exists
CREATE UNIQUE INDEX IF NOT EXISTS single_row_idx ON public.app_version ((TRUE));

-- Insert initial version if table is empty
INSERT INTO public.app_version (version, message) 
SELECT '1.0.0', 'Initial version'
WHERE NOT EXISTS (SELECT 1 FROM public.app_version);

-- Enable RLS
ALTER TABLE public.app_version ENABLE ROW LEVEL SECURITY;

-- Read access for all authenticated users
CREATE POLICY "Anyone can view version"
  ON public.app_version FOR SELECT
  TO authenticated
  USING (true);

-- Write access only for mega admins
CREATE POLICY "Mega admins can update version"
  ON public.app_version FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.app_version
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_version;
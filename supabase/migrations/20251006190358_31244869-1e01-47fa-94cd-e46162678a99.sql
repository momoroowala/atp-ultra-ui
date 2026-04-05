-- Create storage bucket for trade screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('trade-screenshots', 'trade-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Users can upload to their own folder
CREATE POLICY "Users can upload their own screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trade-screenshots' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Users can view their own screenshots
CREATE POLICY "Users can view their own screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'trade-screenshots' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Users can delete their own screenshots
CREATE POLICY "Users can delete their own screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'trade-screenshots' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Admins can manage all screenshots
CREATE POLICY "Admins can manage all screenshots"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'trade-screenshots' AND 
  is_admin(auth.uid())
);
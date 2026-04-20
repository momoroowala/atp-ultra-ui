-- Add review_screenshots column to trade_records table
ALTER TABLE trade_records 
ADD COLUMN review_screenshots TEXT;

COMMENT ON COLUMN trade_records.review_screenshots IS 'JSON array of screenshot URLs uploaded by reviewers during feedback';

-- Create review-screenshots storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-screenshots',
  'review-screenshots',
  true,
  20971520, -- 20MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for review-screenshots bucket

-- Allow admins and reviewers to upload
CREATE POLICY "Admins can upload review screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'review-screenshots' AND
  is_admin(auth.uid())
);

-- Allow admins to delete
CREATE POLICY "Admins can delete review screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'review-screenshots' AND
  is_admin(auth.uid())
);

-- Allow all authenticated users to view
CREATE POLICY "Authenticated users can view review screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'review-screenshots');
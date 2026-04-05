-- Create storage bucket for task submissions
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-submissions', 'task-submissions', true);

-- Allow users to upload files to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'task-submissions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own files
CREATE POLICY "Users can view own files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'task-submissions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'task-submissions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all files
CREATE POLICY "Admins can view all task files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'task-submissions' 
  AND is_admin(auth.uid())
);
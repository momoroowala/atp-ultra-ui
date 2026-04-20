-- Add RLS policies for chat-attachments storage bucket to allow authenticated users to upload and read attachments

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to read attachments (bucket is already public)
CREATE POLICY "Anyone can view attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-attachments');
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('task-submissions', 'task-submissions', true),
  ('review-screenshots', 'review-screenshots', true),
  ('chat-attachments', 'chat-attachments', true),
  ('course-videos', 'course-videos', true)
ON CONFLICT (id) DO NOTHING;

-- =====================
-- AVATARS BUCKET POLICIES
-- =====================

-- Anyone can view avatars (public)
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Authenticated users can upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Admins can upload coach avatars
CREATE POLICY "Admins can upload coach avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'coaches'
  AND public.is_admin(auth.uid())
);

-- Users can update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Users can delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- =====================
-- TASK-SUBMISSIONS BUCKET POLICIES
-- =====================

-- Anyone can view task submissions
CREATE POLICY "Task submissions are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-submissions');

-- Users can upload to their own folder
CREATE POLICY "Users can upload task submissions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'task-submissions' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own submissions
CREATE POLICY "Users can delete their own task submissions"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'task-submissions' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================
-- REVIEW-SCREENSHOTS BUCKET POLICIES
-- =====================

-- Anyone can view review screenshots
CREATE POLICY "Review screenshots are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-screenshots');

-- Users can upload to their own folder
CREATE POLICY "Users can upload review screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'review-screenshots' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own screenshots
CREATE POLICY "Users can delete their own review screenshots"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'review-screenshots' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================
-- CHAT-ATTACHMENTS BUCKET POLICIES
-- =====================

-- Anyone can view chat attachments
CREATE POLICY "Chat attachments are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');

-- Users can upload to their own folder
CREATE POLICY "Users can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================
-- COURSE-VIDEOS BUCKET POLICIES
-- =====================

-- Anyone can view course videos
CREATE POLICY "Course videos are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-videos');

-- Only admins can upload course videos
CREATE POLICY "Admins can upload course videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-videos' 
  AND public.is_admin(auth.uid())
);

-- Only admins can update course videos
CREATE POLICY "Admins can update course videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-videos' 
  AND public.is_admin(auth.uid())
);

-- Only admins can delete course videos
CREATE POLICY "Admins can delete course videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-videos' 
  AND public.is_admin(auth.uid())
);
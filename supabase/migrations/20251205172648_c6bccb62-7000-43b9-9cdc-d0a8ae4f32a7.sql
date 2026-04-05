-- Add storage policies for coach avatar uploads (admin only)
CREATE POLICY "Admins can upload coach avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'coaches'
  AND EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.role_key IN ('admin', 'mega_admin')
  )
);

CREATE POLICY "Admins can update coach avatars"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'coaches'
  AND EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.role_key IN ('admin', 'mega_admin')
  )
);

CREATE POLICY "Admins can delete coach avatars"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'coaches'
  AND EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.role_key IN ('admin', 'mega_admin')
  )
);

CREATE POLICY "Anyone can view coach avatars"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'coaches'
);
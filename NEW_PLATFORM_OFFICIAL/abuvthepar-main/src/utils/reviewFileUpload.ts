import { supabase } from '@/integrations/supabase/client';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Validates if a file is an allowed image type
 */
export const validateFileType = (file: File): boolean => {
  return ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase());
};

/**
 * Validates if a file size is within the allowed limit
 */
export const validateFileSize = (file: File, maxSize: number = MAX_FILE_SIZE): boolean => {
  return file.size <= maxSize;
};

/**
 * Gets the file extension from a filename
 */
export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

/**
 * Uploads a review screenshot to Supabase Storage
 * @param file The file to upload
 * @param userId The ID of the reviewer
 * @param tradeId The ID of the trade being reviewed
 * @returns The public URL of the uploaded file, or null if upload failed
 */
export const uploadReviewScreenshot = async (
  file: File,
  userId: string,
  tradeId: string
): Promise<string | null> => {
  try {
    // Validate file type
    if (!validateFileType(file)) {
      throw new Error('Invalid file type. Only JPG, PNG, and WEBP images are allowed.');
    }

    // Validate file size
    if (!validateFileSize(file)) {
      throw new Error('File size exceeds 20MB limit.');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = getFileExtension(file.name);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${sanitizedName}`;
    const filePath = `${userId}/${tradeId}/${filename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('review-screenshots')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('review-screenshots')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading review screenshot:', error);
    return null;
  }
};

/**
 * Deletes a review screenshot from Supabase Storage
 * @param url The public URL of the file to delete
 * @returns True if deletion was successful, false otherwise
 */
export const deleteReviewScreenshot = async (url: string): Promise<boolean> => {
  try {
    // Extract path from URL
    const urlParts = url.split('/review-screenshots/');
    if (urlParts.length < 2) {
      throw new Error('Invalid URL format');
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('review-screenshots')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting review screenshot:', error);
    return false;
  }
};

/**
 * Formats file size to human-readable string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

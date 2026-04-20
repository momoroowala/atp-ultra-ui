// Video embed helper utilities for handling various video platforms

export interface VimeoUrlParts {
  videoId: string;
  hash?: string;
}

export interface VideoMetadata {
  duration_seconds: number;
  duration_minutes: number;
  thumbnail_url?: string;
  title?: string;
  provider: 'vimeo' | 'youtube' | 'unknown';
}

/**
 * Parse Vimeo URL to extract video ID and optional privacy hash
 * Handles formats:
 * - https://vimeo.com/123456789
 * - https://vimeo.com/123456789/abc123hash
 * - https://player.vimeo.com/video/123456789
 * - https://player.vimeo.com/video/123456789?h=abc123hash
 */
export const parseVimeoUrl = (url: string): VimeoUrlParts | null => {
  if (!url || !url.includes('vimeo.com')) return null;

  // Match vimeo.com/123456789/hash or vimeo.com/123456789
  const standardMatch = url.match(/vimeo\.com\/(\d+)(?:\/([a-zA-Z0-9]+))?/);
  if (standardMatch) {
    return {
      videoId: standardMatch[1],
      hash: standardMatch[2] || undefined,
    };
  }

  // Match player.vimeo.com/video/123456789 with optional h= parameter
  const playerMatch = url.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (playerMatch) {
    const hashMatch = url.match(/[?&]h=([a-zA-Z0-9]+)/);
    return {
      videoId: playerMatch[1],
      hash: hashMatch?.[1] || undefined,
    };
  }

  return null;
};

/**
 * Generate Vimeo embed URL with proper privacy hash handling
 */
export const getVimeoEmbedUrl = (url: string): string | null => {
  const parts = parseVimeoUrl(url);
  if (!parts) return null;

  const baseUrl = `https://player.vimeo.com/video/${parts.videoId}`;
  const hideParams = 'api=1&like=0&watchlater=0&share=0&byline=0&title=0&portrait=0&endscreen=0&end_screen=0';
  return parts.hash ? `${baseUrl}?h=${parts.hash}&${hideParams}` : `${baseUrl}?${hideParams}`;
};

/**
 * Extract YouTube video ID from various URL formats
 */
export const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

/**
 * Get YouTube thumbnail URL
 */
export const getYouTubeThumbnail = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
};

/**
 * Detect video provider from URL
 */
export const detectVideoProvider = (url: string): 'vimeo' | 'youtube' | 'vidalytics' | 'google_drive' | 'unknown' => {
  if (!url) return 'unknown';
  
  if (url.includes('vimeo.com')) return 'vimeo';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vidalytics.com')) return 'vidalytics';
  if (url.includes('drive.google.com') || url.includes('docs.google.com')) return 'google_drive';
  
  return 'unknown';
};

/**
 * Get thumbnail URL from video section data
 * Prioritizes stored thumbnail, falls back to extracting from video URL
 */
export const getVideoThumbnail = (sectionData: Record<string, unknown>): string | null => {
  // Check for stored thumbnail first (from edge function)
  if (sectionData.thumbnail_url && typeof sectionData.thumbnail_url === 'string') {
    return sectionData.thumbnail_url;
  }

  const videoUrl = (sectionData.video_url || sectionData.videoUrl) as string | undefined;
  if (!videoUrl) return null;

  // Try YouTube thumbnail
  const youtubeId = extractYouTubeId(videoUrl);
  if (youtubeId) {
    return getYouTubeThumbnail(youtubeId);
  }

  // For Vimeo, we need the stored thumbnail (fetched via edge function)
  // No direct URL extraction possible without API call
  return null;
};

/**
 * Get video duration from section data (in minutes)
 */
export const getVideoDuration = (sectionData: Record<string, unknown>): number | null => {
  // Check for duration in seconds first, convert to minutes
  if (typeof sectionData.duration === 'number' && sectionData.duration > 0) {
    return Math.round(sectionData.duration / 60);
  }
  
  // Check for duration_minutes
  if (typeof sectionData.duration_minutes === 'number' && sectionData.duration_minutes > 0) {
    return sectionData.duration_minutes;
  }

  return null;
};

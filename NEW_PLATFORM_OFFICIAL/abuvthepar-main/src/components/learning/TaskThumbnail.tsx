import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { getVideoThumbnail, extractYouTubeId, getYouTubeThumbnail, detectVideoProvider } from '@/utils/videoEmbedHelpers';
import { supabase } from '@/integrations/supabase/client';

interface TaskThumbnailProps {
  videoSection?: {
    data?: Record<string, unknown>;
  } | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TaskThumbnail = ({ videoSection, size = 'md', className = '' }: TaskThumbnailProps) => {
  const [fetchedThumbnail, setFetchedThumbnail] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const sectionData = videoSection?.data as Record<string, unknown> | undefined;
  const videoUrl = sectionData ? (sectionData.video_url || sectionData.videoUrl) as string | undefined : undefined;
  
  // Get stored thumbnail first
  const storedThumbnail = sectionData ? getVideoThumbnail(sectionData) : null;
  
  // Try YouTube fallback
  let youtubeThumbnail: string | null = null;
  if (!storedThumbnail && videoUrl) {
    const videoId = extractYouTubeId(videoUrl);
    if (videoId) {
      youtubeThumbnail = getYouTubeThumbnail(videoId);
    }
  }

  // Fetch Vimeo thumbnail on-the-fly if needed
  useEffect(() => {
    const fetchVimeoThumbnail = async () => {
      if (storedThumbnail || youtubeThumbnail || !videoUrl) {
        return;
      }
      
      const provider = detectVideoProvider(videoUrl);
      if (provider !== 'vimeo') {
        return;
      }
      
      try {
        const { data, error } = await supabase.functions.invoke('get-video-metadata', {
          body: { video_url: videoUrl },
        });
        
        if (!error && data?.thumbnail_url) {
          setFetchedThumbnail(data.thumbnail_url);
        }
      } catch (err) {
        console.error('Failed to fetch Vimeo thumbnail:', err);
      }
    };

    fetchVimeoThumbnail();
  }, [videoUrl, storedThumbnail, youtubeThumbnail]);

  const thumbnailUrl = storedThumbnail || youtubeThumbnail || fetchedThumbnail;

  const sizeClasses = {
    sm: 'w-16 h-12',
    md: 'w-24 h-16',
    lg: 'w-32 h-20',
  };

  if (!thumbnailUrl || imageError) {
    return (
      <div className={`${sizeClasses[size]} ${className} rounded-md bg-muted flex items-center justify-center shrink-0`}>
        <Play className="w-4 h-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} rounded-md overflow-hidden relative shrink-0 bg-muted`}>
      <img 
        src={thumbnailUrl} 
        alt="Video thumbnail" 
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
        <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
          <Play className="w-3 h-3 text-foreground ml-0.5" fill="currentColor" />
        </div>
      </div>
    </div>
  );
};

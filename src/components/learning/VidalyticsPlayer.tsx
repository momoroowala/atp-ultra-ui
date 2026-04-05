import { useEffect, useState, useRef } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DOMPurify from 'dompurify';

interface VidalyticsPlayerProps {
  videoId: string;
  accountId?: string;
  title?: string;
  /** Fires once when ≥ 80% of duration has elapsed (fallback timer) */
  onProgress80?: () => void;
  /** Duration in minutes for the 80% fallback timer */
  durationMinutes?: number | null;
}

interface OEmbedResponse {
  html: string;
  thumbnail_url: string;
  title?: string;
}

export const VidalyticsPlayer = ({ videoId, accountId = 'uhUjn7YN', title, onProgress80, durationMinutes }: VidalyticsPlayerProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [embedHtml, setEmbedHtml] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasReported80Ref = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchAndEmbedVideo = async () => {
      try {
        console.log('[Vidalytics] Starting video load for ID:', videoId);
        setLoading(true);
        setError(null);
        
        // Construct the preview URL
        const previewUrl = `https://preview.vidalytics.com/vid/${videoId}`;
        console.log('[Vidalytics] Preview URL:', previewUrl);
        
        // Fetch oEmbed data
        const oembedUrl = `https://preview.vidalytics.com/oembed?url=${encodeURIComponent(previewUrl)}`;
        console.log('[Vidalytics] Fetching oEmbed from:', oembedUrl);
        
        const response = await fetch(oembedUrl);
        console.log('[Vidalytics] Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to load video: ${response.status} ${response.statusText}`);
        }
        
        const data: OEmbedResponse = await response.json();
        console.log('[Vidalytics] oEmbed data received:', data);
        
        // Parse HTML to separate div from script
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.html, 'text/html');
        
        // Get the embed div HTML
        const embedDiv = doc.querySelector('div[id^="vidalytics_embed_"]');
        if (!embedDiv) {
          throw new Error('No embed div found in oEmbed response');
        }
        
        // Sanitize the embed HTML to prevent XSS attacks
        // Allow only Vidalytics-related elements and attributes
        // FORBID_TAGS includes 'script' to prevent XSS via injected scripts
        const sanitizedHtml = DOMPurify.sanitize(embedDiv.outerHTML, {
          ADD_TAGS: ['iframe'],
          ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
          FORBID_TAGS: ['script'],
          ALLOWED_URI_REGEXP: /^https:\/\/(.*\.)?(vidalytics\.com|vidalytics\.io)\//i,
        });

        setEmbedHtml(sanitizedHtml);
        
        console.log('[Vidalytics] Video embed setup complete');
        setLoading(false);
      } catch (err) {
        console.error('[Vidalytics] Error during video load:', err);
        setError('Failed to load video');
        setLoading(false);
      }
    };

    fetchAndEmbedVideo();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [videoId]);

  // Duration-based 80% fallback timer
  useEffect(() => {
    if (!durationMinutes || durationMinutes <= 0 || !onProgress80 || loading) return;
    hasReported80Ref.current = false;
    const ms = durationMinutes * 60 * 1000 * 0.8;
    timerRef.current = window.setTimeout(() => {
      if (!hasReported80Ref.current) {
        hasReported80Ref.current = true;
        onProgress80();
      }
    }, ms);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [durationMinutes, onProgress80, loading]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">Loading video...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full group">
      <div 
        className="w-full h-full" 
        dangerouslySetInnerHTML={{ __html: embedHtml }}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </Button>
    </div>
  );
};

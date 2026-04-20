import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, RotateCcw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VimeoPlayerWrapperProps {
  embedUrl: string;
  title?: string;
  className?: string;
  onNextLesson?: () => void;
  hasNextLesson?: boolean;
  /** Fires once when ≥ 80% of the video has been watched */
  onProgress80?: () => void;
}

export function VimeoPlayerWrapper({
  embedUrl,
  title = 'Video',
  className,
  onNextLesson,
  hasNextLesson,
  onProgress80,
}: VimeoPlayerWrapperProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const hasReported80Ref = useRef(false);

  // Ensure api=1 is always present for postMessage events
  const finalUrl = useMemo(() => {
    try {
      const url = new URL(embedUrl);
      if (!url.searchParams.has('api')) {
        url.searchParams.set('api', '1');
      }
      return url.toString();
    } catch {
      return embedUrl;
    }
  }, [embedUrl]);

  // Reset state when video changes
  useEffect(() => {
    setShowOverlay(false);
    hasReported80Ref.current = false;
  }, [embedUrl]);

  // Listen for Vimeo finish events
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;

        if (msg.event === 'finish' && !showOverlay) {
          setShowOverlay(true);
          return;
        }

        if (msg.event === 'playProgress') {
          const percent = msg.data?.percent ?? 0;
          if (percent >= 0.8 && !hasReported80Ref.current) {
            hasReported80Ref.current = true;
            onProgress80?.();
          }
          if (percent >= 0.99 && !showOverlay) {
            setShowOverlay(true);
          }
        }
      } catch { /* ignore */ }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [showOverlay, onProgress80]);

  // Register for events once iframe loads
  const handleIframeLoad = useCallback(() => {
    try {
      const win = iframeRef.current?.contentWindow;
      win?.postMessage(JSON.stringify({ method: 'addEventListener', value: 'playProgress' }), '*');
      win?.postMessage(JSON.stringify({ method: 'addEventListener', value: 'finish' }), '*');
    } catch { /* cross-origin safety */ }
  }, []);

  const handleReplay = useCallback(() => {
    setShowOverlay(false);
    try {
      const win = iframeRef.current?.contentWindow;
      if (win) {
        win.postMessage(JSON.stringify({ method: 'seekTo', value: 0 }), '*');
        win.postMessage(JSON.stringify({ method: 'play' }), '*');
      }
    } catch { /* cross-origin safety */ }
  }, []);

  return (
    <div className={cn('relative select-none', className || 'iframe-wrapper')}>
      {/* Transparent overlay to block Vimeo social buttons */}
      <div className="absolute top-0 left-0 right-0 h-[15%] z-10" />

      <iframe
        ref={iframeRef}
        src={finalUrl}
        className={`w-full h-full ${showOverlay ? 'pointer-events-none' : 'pointer-events-auto'}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={title}
        onLoad={handleIframeLoad}
      />

      {/* End-of-video overlay */}
      {showOverlay && (
        <div className="absolute inset-0 z-20 bg-black flex items-center justify-center animate-fade-in">
          <div className="flex flex-col items-center gap-5 text-center px-6">
            <CheckCircle className="h-14 w-14 text-primary" />
            <h3 className="text-xl font-bold text-white">Lesson Complete</h3>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="gap-2 border-white/30 text-white hover:bg-white/10"
                onClick={handleReplay}
              >
                <RotateCcw className="h-4 w-4" />
                Replay Video
              </Button>

              {hasNextLesson && onNextLesson && (
                <Button className="gap-2" onClick={onNextLesson}>
                  Next Lesson
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

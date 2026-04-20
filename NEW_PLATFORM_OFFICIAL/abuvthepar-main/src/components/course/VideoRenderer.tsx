import { SecureYouTubePlayer } from '@/components/learning/SecureYouTubePlayer';
import { VidalyticsPlayer } from '@/components/learning/VidalyticsPlayer';
import { VimeoPlayerWrapper } from '@/components/course/VimeoPlayerWrapper';
import { getVimeoEmbedUrl } from '@/utils/videoEmbedHelpers';

interface VideoSection {
  id: string;
  section_type: string;
  title: string | null;
  data: any;
}

interface VideoRendererProps {
  videoSection: VideoSection | null | undefined;
  className?: string;
  /** Duration in minutes (used for fallback timer on non-YouTube players) */
  durationMinutes?: number | null;
  /** Navigate to the next lesson */
  onNextLesson?: () => void;
  /** Whether there is a next lesson available */
  hasNextLesson?: boolean;
  /** Fires once when ≥ 80% of the video has been watched */
  onProgress80?: () => void;
}

export function VideoRenderer({ videoSection, className, durationMinutes, onNextLesson, hasNextLesson, onProgress80 }: VideoRendererProps) {
  if (!videoSection?.data) return null;

  const data = videoSection.data;
  if (typeof data !== 'object') return null;

  if ('embed_url' in data && data.embed_url) {
    const embedUrl = String(data.embed_url);
    const isVimeoEmbed = embedUrl.includes('vimeo.com');

    if (isVimeoEmbed) {
      return (
        <VimeoPlayerWrapper
          embedUrl={embedUrl}
          title={videoSection.title || "Video"}
          className={className}
          onNextLesson={onNextLesson}
          hasNextLesson={hasNextLesson}
          onProgress80={onProgress80}
        />
      );
    }

    return (
      <div className={className}>
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={videoSection.title || "Video"}
        />
      </div>
    );
  }

  if ('video_url' in data && data.video_url) {
    const raw = String(data.video_url);
    const isYouTube = /youtu\.?be/.test(raw) || raw.includes("youtube.com");
    const isVimeo = raw.includes("vimeo.com");
    const isDrive = raw.includes("drive.google.com") || raw.includes("docs.google.com");
    const isVidalytics = raw.includes("vidalytics.com") || raw.includes("preview.vidalytics.com");

    if (isVidalytics) {
      const vidMatch = raw.match(/vidalytics\.com\/vid\/([^?&#/]+)/) ||
                       raw.match(/vidalytics_embed_([^?&#/\s]+)/);
      const videoId = vidMatch ? vidMatch[1] : null;
      return videoId ? <VidalyticsPlayer videoId={videoId} title={videoSection.title || "Video"} onProgress80={onProgress80} durationMinutes={durationMinutes} /> : null;
    }

    if (isYouTube) {
      const ytIdMatch = raw.match(/[?&]v=([^&#]+)/) || raw.match(/youtu\.be\/([^?&#/]+)/);
      const ytId = ytIdMatch ? ytIdMatch[1] : null;
      return ytId ? <SecureYouTubePlayer videoId={ytId} title={videoSection.title || "Video"} onProgress80={onProgress80} /> : null;
    }

    if (isVimeo) {
      const embedSrc = getVimeoEmbedUrl(raw);
      if (embedSrc) {
        return (
          <VimeoPlayerWrapper
            embedUrl={embedSrc}
            title={videoSection.title || "Video"}
            className={className || "iframe-wrapper relative select-none"}
            onNextLesson={onNextLesson}
            hasNextLesson={hasNextLesson}
            onProgress80={onProgress80}
          />
        );
      }
    }

    if (isDrive) {
      let preview = raw
        .replace(/\/view(\?.*)?$/, "/preview")
        .replace(/\/download(\?.*)?$/, "/preview");
      if (!/\/file\/d\//.test(preview)) {
        const idMatch = raw.match(/\/file\/d\/([^/]+)/) || raw.match(/[?&]id=([^&#]+)/);
        const fileId = idMatch ? idMatch[1] : null;
        if (fileId) {
          preview = `https://drive.google.com/file/d/${fileId}/preview`;
        }
      }
      if (/drive\.google\.com\/file\/d\/.+\/preview/.test(preview)) {
        return (
          <div className={className || "iframe-wrapper relative select-none"}>
            <iframe
              src={preview}
              className="w-full h-full pointer-events-auto"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={videoSection.title || "Video"}
            />
          </div>
        );
      }
    }

    return <video src={raw} controls controlsList="nodownload" onContextMenu={e => e.preventDefault()} className="w-full h-full" playsInline />;
  }

  return null;
}

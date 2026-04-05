import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from 'lucide-react';

interface SecureYouTubePlayerProps {
  videoId: string;
  title?: string;
  onReady?: () => void;
  onEnd?: () => void;
  /** Fires once when the user has watched ≥ 80% of the video */
  onProgress80?: () => void;
}

export const SecureYouTubePlayer: React.FC<SecureYouTubePlayerProps> = ({
  videoId,
  title = 'Video',
  onReady,
  onEnd,
  onProgress80,
}) => {
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerElementRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const hasReported80Ref = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isReady, setIsReady] = useState(false);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initializePlayer();
      return;
    }

    // Load the API if not already loaded
    if (!window.onYouTubeIframeAPIReady) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    } else {
      // API is loading, wait for it
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          initializePlayer();
        }
      }, 100);

      return () => clearInterval(checkInterval);
    }
  }, [videoId]);

  const initializePlayer = () => {
    if (!playerElementRef.current) return;

    playerRef.current = new window.YT.Player(playerElementRef.current, {
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        cc_load_policy: 0,
        enablejsapi: 1,
        origin: window.location.origin,
        playsinline: 1,
      },
      events: {
        onReady: handlePlayerReady,
        onStateChange: handleStateChange,
        onError: handleError,
      },
    });
  };

  const handlePlayerReady = (event: YT.PlayerEvent) => {
    setIsReady(true);
    setDuration(event.target.getDuration());
    setVolume(event.target.getVolume());
    setIsMuted(event.target.isMuted());
    onReady?.();
  };

  const handleStateChange = (event: YT.OnStateChangeEvent) => {
    const state = event.data;

    if (state === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      setIsBuffering(false);
      startProgressTracking();
    } else if (state === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
      setIsBuffering(false);
      stopProgressTracking();
    } else if (state === window.YT.PlayerState.BUFFERING) {
      setIsBuffering(true);
    } else if (state === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
      stopProgressTracking();
      if (!hasReported80Ref.current) {
        hasReported80Ref.current = true;
        onProgress80?.();
      }
      onEnd?.();
    }
  };

  const handleError = (event: YT.OnErrorEvent) => {
    console.error('YouTube Player Error:', event.data);
    setIsBuffering(false);
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) return;

    progressIntervalRef.current = window.setInterval(() => {
      if (playerRef.current) {
        const ct = playerRef.current.getCurrentTime();
        setCurrentTime(ct);
        const dur = playerRef.current.getDuration();
        if (dur > 0 && ct / dur >= 0.8 && !hasReported80Ref.current) {
          hasReported80Ref.current = true;
          onProgress80?.();
        }
      }
    }, 100);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopProgressTracking();
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  const togglePlayPause = () => {
    if (!playerRef.current || !isReady) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const toggleMute = () => {
    if (!playerRef.current || !isReady) return;

    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!playerRef.current || !isReady) return;

    const newVolume = parseInt(e.target.value);
    playerRef.current.setVolume(newVolume);
    setVolume(newVolume);

    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!playerRef.current || !isReady) return;

    const newTime = parseFloat(e.target.value);
    playerRef.current.seekTo(newTime, true);
    setCurrentTime(newTime);
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className="secure-youtube-player"
      onContextMenu={(e) => e.preventDefault()}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div
        ref={playerElementRef}
        className={`secure-youtube-player-iframe ${isPlaying ? 'playing' : ''}`}
      />

      {/* Black overlay to hide YouTube title/branding at top */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-black z-[3] pointer-events-none" />

      {/* Loading overlay */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* Semi-transparent overlay when paused to hide YouTube UI */}
      {!isPlaying && isReady && (
        <div 
          className="absolute inset-0 bg-black/60 z-[5] cursor-pointer flex items-center justify-center" 
          onClick={togglePlayPause}
        >
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center hover:bg-white/30 transition-colors">
            <Play className="w-10 h-10 text-white ml-1" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Custom controls */}
      <div className={`custom-video-controls ${showControls || !isPlaying ? 'show' : ''}`}>
        {/* Progress bar */}
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="video-progress-bar"
            disabled={!isReady}
          />
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              className="text-white hover:text-primary transition-colors"
              disabled={!isReady}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" fill="currentColor" />
              ) : (
                <Play className="w-6 h-6" fill="currentColor" />
              )}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-primary transition-colors"
                disabled={!isReady}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="video-volume-slider w-20"
                disabled={!isReady}
                aria-label="Volume"
              />
            </div>

            {/* Time */}
            <span className="text-white text-sm font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Fullscreen */}
          <button
            onClick={handleFullscreen}
            className="text-white hover:text-primary transition-colors"
            aria-label="Fullscreen"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

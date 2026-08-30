import React, { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Bookmark,
  BookmarkCheck,
  Heart,
  Share2,
  ListVideo,
  Settings2,
  RotateCcw,
  AlertCircle,
  Lock,
  Sparkles,
  Loader2,
  Film,
} from 'lucide-react';
import { Drama, Episode } from '../../types';
import { videoService } from '../../services/videoService';
import { adService } from '../../services/adService';

interface EpisodePlayerItemProps {
  episode: Episode;
  drama: Drama;
  isActive: boolean;
  isPreload?: boolean;
  isMuted: boolean;
  playbackSpeed: number;
  quality: string;
  isSavedInMyShows: boolean;
  onToggleMyShows: () => void;
  onToggleMute: () => void;
  onOpenEpisodesDrawer: () => void;
  onOpenSettingsModal: () => void;
  onEpisodeEnded: (episode: Episode) => void;
  onProgressUpdate: (episode: Episode, currentTime: number, duration: number) => void;
  onHaptic: (type?: 'light' | 'medium' | 'heavy' | 'selection' | 'success') => void;
}

export const EpisodePlayerItem: React.FC<EpisodePlayerItemProps> = ({
  episode,
  drama,
  isActive,
  isPreload = false,
  isMuted,
  playbackSpeed,
  quality,
  isSavedInMyShows,
  onToggleMyShows,
  onToggleMute,
  onOpenEpisodesDrawer,
  onOpenSettingsModal,
  onEpisodeEnded,
  onProgressUpdate,
  onHaptic,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const endedFiredRef = useRef<boolean>(false);

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() =>
    adService.isEpisodeUnlocked(drama.id, episode.episodeNumber, episode.freeToWatch)
  );
  const [isUnlockingWithAd, setIsUnlockingWithAd] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(episode.duration || 0);
  const [showCenterIcon, setShowCenterIcon] = useState<'play' | 'pause' | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(1420 + episode.episodeNumber * 83);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isSeeking, setIsSeeking] = useState(false);

  // Sync unlock status with AdService
  useEffect(() => {
    setIsUnlocked(adService.isEpisodeUnlocked(drama.id, episode.episodeNumber, episode.freeToWatch));
    const unsubscribe = adService.onUnlockListener((unlockedDramaId, unlockedEp) => {
      if (unlockedDramaId === drama.id && unlockedEp === episode.episodeNumber) {
        setIsUnlocked(true);
      }
    });
    return () => unsubscribe();
  }, [drama.id, episode.episodeNumber, episode.freeToWatch]);

  const handleWatchAdToUnlock = async () => {
    if (isUnlockingWithAd) return;
    setIsUnlockingWithAd(true);
    onHaptic('medium');

    try {
      const res = await adService.unlockEpisodeWithRewardedAd(drama.id, episode.episodeNumber);
      if (res.success) {
        setIsUnlocked(true);
        onHaptic('success');
        if (videoRef.current && isActive) {
          videoRef.current.play().catch(() => {});
        }
      } else {
        onHaptic('heavy');
      }
    } catch (err) {
      console.error('[EpisodePlayerItem] Failed to unlock via Rewarded Interstitial:', err);
    } finally {
      setIsUnlockingWithAd(false);
    }
  };

  // Initialize Video Stream Source
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setHasError(false);
    endedFiredRef.current = false;

    // If item is neither active nor immediate next preload, save memory
    if (!isActive && !isPreload) {
      video.src = '';
      return;
    }

    const streamUrl = videoService.resolveStreamUrl(episode, quality);
    if (!streamUrl) return;

    if (episode.videoType === 'hls' && Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        autoStartLoad: true,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        if (isActive) {
          video.play().catch(() => setIsPlaying(false));
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setHasError(true);
              setErrorMessage('Failed to load video stream');
              hls.destroy();
              break;
          }
        }
      });
    } else {
      // Native HTML5 MP4 / Safari stream
      if (video.src !== streamUrl) {
        video.src = streamUrl;
        video.load();
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [episode, quality, isActive, isPreload]);

  // Synchronize Playback State when active
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive && isUnlocked) {
      endedFiredRef.current = false;
      video.playbackRate = playbackSpeed;
      video.muted = isMuted;

      const triggerAutoplay = async () => {
        try {
          await video.play();
          setIsPlaying(true);
          setIsBuffering(false);
        } catch (err: any) {
          // Autoplay policy fallback: if unmuted autoplay is blocked, retry muted
          if (!video.muted) {
            try {
              video.muted = true;
              await video.play();
              setIsPlaying(true);
              setIsBuffering(false);
            } catch {
              setIsPlaying(false);
            }
          } else {
            setIsPlaying(false);
          }
        }
      };

      if (video.readyState >= 2) {
        triggerAutoplay();
      } else {
        const handleCanPlay = () => {
          triggerAutoplay();
          video.removeEventListener('canplay', handleCanPlay);
        };
        video.addEventListener('canplay', handleCanPlay);
        return () => {
          video.removeEventListener('canplay', handleCanPlay);
        };
      }
    } else {
      video.pause();
      setIsPlaying(false);
      // Reset position when navigating away
      if (video.currentTime > 0) {
        video.currentTime = 0;
        setCurrentTime(0);
      }
    }
  }, [isActive, isUnlocked, playbackSpeed, isMuted, episode.id]);

  // Dynamically update audio mute & speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Handle End of Video reliably
  const handleVideoEnded = useCallback(() => {
    if (!isActive) return;
    if (endedFiredRef.current) return;
    endedFiredRef.current = true;
    setIsPlaying(false);
    onEpisodeEnded(episode);
  }, [isActive, episode, onEpisodeEnded]);

  // Touch / Tap Handling
  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchContainer = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      handleDoubleTap(e);
    } else {
      tapTimeoutRef.current = setTimeout(() => {
        togglePlayPause();
      }, DOUBLE_TAP_DELAY);
    }
    lastTapRef.current = now;
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
        setShowCenterIcon('play');
        setTimeout(() => setShowCenterIcon(null), 600);
      }).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
      setShowCenterIcon('pause');
      setTimeout(() => setShowCenterIcon(null), 600);
    }
    onHaptic('light');
  };

  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    setIsLiked(true);
    setLikesCount((prev) => prev + 1);
    onHaptic('medium');

    const rect = containerRef.current?.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX || 150 : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY || 300 : (e as React.MouseEvent).clientY;

    const x = rect ? clientX - rect.left : 150;
    const y = rect ? clientY - rect.top : 300;

    const heartId = Date.now();
    setFloatingHearts((prev) => [...prev, { id: heartId, x, y }]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== heartId));
    }, 1000);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || isSeeking) return;

    const cur = video.currentTime;
    const dur = video.duration || episode.duration || 1;
    setCurrentTime(cur);
    setDuration(dur);
    onProgressUpdate(episode, cur, dur);

    // Natural end trigger guard for continuous playback
    if (dur > 0 && cur >= dur - 0.2 && !endedFiredRef.current && isActive) {
      handleVideoEnded();
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || episode.duration);
      setIsBuffering(false);
    }
  };

  const handleVideoError = () => {
    setIsBuffering(false);
    setHasError(true);
    setErrorMessage('Video temporarily unavailable. Tap to retry.');
  };

  const handleRetry = () => {
    setHasError(false);
    setIsBuffering(true);
    if (videoRef.current) {
      videoRef.current.load();
      if (isActive) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const handleShare = () => {
    onHaptic('light');
    if (navigator.share) {
      navigator.share({
        title: `${drama.title} - ${episode.title}`,
        text: `Watch ${drama.title} Ep.${episode.episodeNumber} on Vela!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      id={`episode-player-${episode.id}`}
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden select-none"
    >
      {/* Background Poster fallback while video loads */}
      <img
        src={episode.thumbnailUrl || episode.thumbnail || drama.coverImage || drama.poster}
        alt={episode.title}
        referrerPolicy="no-referrer"
        className={`absolute inset-0 w-full h-full object-cover blur-sm opacity-30 transition-opacity duration-500 ${
          isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-40'
        }`}
      />

      {/* Main Video Element - True Edge-to-Edge Fullscreen Vertical Viewport */}
      <video
        ref={videoRef}
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        x5-video-player-type="h5"
        x5-video-orientation="portrait"
        muted={isMuted}
        loop={false}
        preload={isActive ? 'auto' : isPreload ? 'metadata' : 'none'}
        poster={episode.thumbnailUrl || episode.thumbnail || drama.coverImage || drama.poster}
        onLoadStart={() => setIsBuffering(true)}
        onLoadedData={() => setIsBuffering(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={handleVideoEnded}
        onError={handleVideoError}
        className="w-full h-full object-cover cursor-pointer"
        onClick={handleTouchContainer}
      />

      {/* Center Tap Play/Pause Indicator Animation */}
      <AnimatePresence>
        {showCenterIcon && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 0.9 }}
            exit={{ scale: 1.3, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute z-30 pointer-events-none w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-2xl"
          >
            {showCenterIcon === 'play' ? (
              <Play className="w-8 h-8 fill-white translate-x-0.5" />
            ) : (
              <Pause className="w-8 h-8 fill-white" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Hearts on Double Tap */}
      {floatingHearts.map((heart) => (
        <motion.div
          key={heart.id}
          initial={{ opacity: 1, scale: 0.5, y: 0 }}
          animate={{ opacity: 0, scale: 1.8, y: -120 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ left: heart.x - 24, top: heart.y - 24 }}
          className="absolute z-40 pointer-events-none text-rose-500"
        >
          <Heart className="w-12 h-12 fill-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]" />
        </motion.div>
      ))}

      {/* Sleek Buffering & Loading Spinner */}
      {isBuffering && !hasError && isUnlocked && (
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center bg-black/35 backdrop-blur-[2px]">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-3 border-white/15 border-t-rose-500 border-r-rose-500/60 animate-spin" />
            <div className="absolute w-5 h-5 rounded-full bg-rose-500/20 animate-ping" />
          </div>
          <p className="mt-3 text-xs font-semibold text-white/90 tracking-wide drop-shadow">
            Loading Episode {episode.episodeNumber}...
          </p>
        </div>
      )}

      {/* Locked Episode Overlay - Rewarded Interstitial Prompt */}
      {!isUnlocked && (
        <div className="absolute inset-0 z-35 flex flex-col items-center justify-center p-6 bg-black/85 backdrop-blur-md text-center">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-600/30 to-rose-600/30 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-2xl shadow-amber-500/20">
              <Lock className="w-9 h-9 text-amber-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center border-2 border-[#12141a]">
              <Sparkles className="w-3 h-3 text-white fill-white" />
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-2">
            Premium Episode {episode.episodeNumber}
          </span>

          <h3 className="text-xl font-black text-white font-display tracking-tight mb-1.5">
            {episode.title}
          </h3>

          <p className="text-xs text-white/70 max-w-xs leading-relaxed mb-6">
            Watch a short sponsored ad to instantly unlock this episode in HD and continue streaming!
          </p>

          <div className="w-full max-w-xs space-y-3">
            <button
              id={`player-unlock-btn-ep-${episode.episodeNumber}`}
              onClick={handleWatchAdToUnlock}
              disabled={isUnlockingWithAd}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-600 to-rose-500 hover:from-amber-400 hover:to-rose-400 active:scale-95 text-white font-black text-sm flex items-center justify-center space-x-2 shadow-2xl shadow-rose-600/40 transition-all cursor-pointer border border-white/20"
            >
              {isUnlockingWithAd ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Loading Rewarded Ad...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200" />
                  <span>WATCH AD TO UNLOCK</span>
                </>
              )}
            </button>

            <button
              id={`player-open-drawer-btn-ep-${episode.episodeNumber}`}
              onClick={onOpenEpisodesDrawer}
              className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white/80 font-bold text-xs flex items-center justify-center space-x-2 border border-white/10 transition-all"
            >
              <ListVideo className="w-3.5 h-3.5" />
              <span>Select Different Episode</span>
            </button>
          </div>
        </div>
      )}

      {/* Video Error Overlay */}
      {hasError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-black/85 text-center backdrop-blur-sm">
          <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
          <h4 className="text-base font-bold text-white mb-1">Playback Error</h4>
          <p className="text-xs text-white/60 mb-4 max-w-xs">{errorMessage}</p>
          <button
            id="retry-video-btn"
            onClick={handleRetry}
            className="flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl active:scale-95 transition-all shadow-lg shadow-rose-600/30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Playback</span>
          </button>
        </div>
      )}

      {/* Top Gradient Overlay */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none z-10" />

      {/* Bottom Gradient Overlay */}
      <div className="absolute bottom-0 inset-x-0 h-72 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-10" />

      {/* Right Side Action Rails */}
      <div className="absolute right-3.5 bottom-28 z-20 flex flex-col items-center space-y-4">
        {/* Play/Pause Quick Button */}
        <button
          id={`play-pause-btn-ep-${episode.episodeNumber}`}
          onClick={(e) => {
            e.stopPropagation();
            togglePlayPause();
          }}
          className="w-11 h-11 rounded-full bg-black/40 text-white/90 border border-white/15 backdrop-blur-md flex items-center justify-center active:scale-90 transition-all shadow-lg"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white fill-white" />
          ) : (
            <Play className="w-5 h-5 text-white fill-white translate-x-0.5" />
          )}
        </button>

        {/* Like Button */}
        <button
          id={`like-btn-ep-${episode.episodeNumber}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
            setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
            onHaptic('light');
          }}
          className="flex flex-col items-center space-y-1 group"
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 ${
              isLiked
                ? 'bg-rose-600/30 text-rose-500 border border-rose-500/50 shadow-lg shadow-rose-600/20'
                : 'bg-black/40 text-white/90 border border-white/15'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
          </div>
          <span className="text-[11px] font-semibold text-white/90 drop-shadow">
            {likesCount > 1000 ? `${(likesCount / 1000).toFixed(1)}k` : likesCount}
          </span>
        </button>

        {/* Bookmark / My Shows Button */}
        <button
          id={`bookmark-btn-ep-${episode.episodeNumber}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleMyShows();
          }}
          className="flex flex-col items-center space-y-1"
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 ${
              isSavedInMyShows
                ? 'bg-amber-500/30 text-amber-400 border border-amber-400/50 shadow-lg shadow-amber-500/20'
                : 'bg-black/40 text-white/90 border border-white/15'
            }`}
          >
            {isSavedInMyShows ? (
              <BookmarkCheck className="w-5 h-5 fill-amber-400 text-amber-400" />
            ) : (
              <Bookmark className="w-5 h-5 text-white" />
            )}
          </div>
          <span className="text-[11px] font-semibold text-white/90 drop-shadow">
            {isSavedInMyShows ? 'Saved' : 'Save'}
          </span>
        </button>

        {/* Episodes Drawer Quick Access */}
        <button
          id={`episodes-drawer-btn-${episode.episodeNumber}`}
          onClick={(e) => {
            e.stopPropagation();
            onOpenEpisodesDrawer();
            onHaptic('light');
          }}
          className="flex flex-col items-center space-y-1"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 text-white/90 border border-white/15 backdrop-blur-md flex items-center justify-center active:scale-90 transition-all">
            <ListVideo className="w-5 h-5 text-white" />
          </div>
          <span className="text-[11px] font-semibold text-white/90 drop-shadow">
            Ep.{episode.episodeNumber}/{drama.totalEpisodes}
          </span>
        </button>

        {/* Share Button */}
        <button
          id={`share-btn-ep-${episode.episodeNumber}`}
          onClick={(e) => {
            e.stopPropagation();
            handleShare();
          }}
          className="flex flex-col items-center space-y-1"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 text-white/90 border border-white/15 backdrop-blur-md flex items-center justify-center active:scale-90 transition-all">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-[11px] font-semibold text-white/90 drop-shadow">Share</span>
        </button>

        {/* Audio Mute / Unmute */}
        <button
          id={`mute-btn-ep-${episode.episodeNumber}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
            onHaptic('light');
          }}
          className="w-11 h-11 rounded-full bg-black/40 text-white/90 border border-white/15 backdrop-blur-md flex items-center justify-center active:scale-90 transition-all"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-rose-400" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </button>

        {/* Settings modal button */}
        <button
          id={`settings-btn-ep-${episode.episodeNumber}`}
          onClick={(e) => {
            e.stopPropagation();
            onOpenSettingsModal();
            onHaptic('light');
          }}
          className="w-11 h-11 rounded-full bg-black/40 text-white/90 border border-white/15 backdrop-blur-md flex items-center justify-center active:scale-90 transition-all"
        >
          <Settings2 className="w-4 h-4 text-white/80" />
        </button>
      </div>

      {/* Bottom Metadata & Controls */}
      <div className="absolute left-0 right-16 bottom-6 z-20 px-4 space-y-2 pointer-events-auto">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-600 text-white shadow-md shadow-rose-600/30">
            Ep. {episode.episodeNumber}
          </span>
          <h2 className="text-base font-extrabold text-white font-display tracking-tight drop-shadow-md truncate max-w-[220px]">
            {drama.title}
          </h2>
        </div>

        <p className="text-xs font-semibold text-white/90 drop-shadow-sm line-clamp-1">
          {episode.title}
        </p>

        <div className="flex items-center gap-1.5 flex-wrap">
          {drama.genres.slice(0, 2).map((g) => (
            <span
              key={g}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/10 text-white/80 border border-white/10 backdrop-blur-sm"
            >
              {g}
            </span>
          ))}
          {playbackSpeed !== 1 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {playbackSpeed}x
            </span>
          )}
        </div>

        {/* Compact Scrubber Progress Bar */}
        <div className="pt-2 flex items-center space-x-2">
          <span className="text-[10px] font-mono text-white/70 tabular-nums">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center group cursor-pointer py-1">
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onMouseDown={() => setIsSeeking(true)}
              onMouseUp={() => setIsSeeking(false)}
              onTouchStart={() => setIsSeeking(true)}
              onTouchEnd={() => setIsSeeking(false)}
              onChange={handleScrubChange}
              className="absolute inset-0 w-full opacity-0 cursor-pointer h-4"
            />
          </div>
          <span className="text-[10px] font-mono text-white/50 tabular-nums">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};

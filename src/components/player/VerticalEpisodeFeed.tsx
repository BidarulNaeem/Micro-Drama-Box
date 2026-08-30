import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Award, RotateCcw, Home } from 'lucide-react';
import { Drama, Episode } from '../../types';
import { EpisodePlayerItem } from './EpisodePlayerItem';
import { EpisodeDrawer } from './EpisodeDrawer';
import { PlayerSettingsModal } from './PlayerSettingsModal';
import { adService } from '../../services/adService';
import { userProgressRepository } from '../../repositories/userProgressRepository';
import { dramaRepository } from '../../repositories/dramaRepository';
import { videoService } from '../../services/videoService';

interface VerticalEpisodeFeedProps {
  drama: Drama;
  initialEpisodeNumber?: number;
  onBack: () => void;
  onSelectAnotherDrama: (dramaId: string) => void;
  onHaptic: (type?: 'light' | 'medium' | 'heavy' | 'success') => void;
}

export const VerticalEpisodeFeed: React.FC<VerticalEpisodeFeedProps> = ({
  drama,
  initialEpisodeNumber = 1,
  onBack,
  onSelectAnotherDrama,
  onHaptic,
}) => {
  const [liveEpisodes, setLiveEpisodes] = useState<Episode[]>(drama.episodes || []);
  const episodes = liveEpisodes.length > 0 ? liveEpisodes : (drama.episodes || []);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAutoAdvancingRef = useRef<boolean>(false);

  // Subscribe to live Firestore episodes for this drama
  useEffect(() => {
    const unsubscribe = dramaRepository.subscribeEpisodes(drama.id, (eps) => {
      if (eps && eps.length > 0) {
        setLiveEpisodes(eps);
      }
    });
    return () => unsubscribe();
  }, [drama.id]);

  const [currentIndex, setCurrentIndex] = useState(() => {
    const epList = drama.episodes || [];
    const idx = epList.findIndex((e) => e.episodeNumber === initialEpisodeNumber);
    return idx >= 0 ? idx : 0;
  });

  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [quality, setQuality] = useState('1080p');
  const [isSavedInMyShows, setIsSavedInMyShows] = useState(false);
  const [isEpisodesDrawerOpen, setIsEpisodesDrawerOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSeriesCompleted, setIsSeriesCompleted] = useState(false);

  // Check saved state in My Shows
  useEffect(() => {
    userProgressRepository.isMyShow(drama.id).then(setIsSavedInMyShows);
  }, [drama.id]);

  // Initial scroll to starting episode on mount
  useEffect(() => {
    const initialIdx = episodes.findIndex((e) => e.episodeNumber === initialEpisodeNumber);
    const targetIdx = initialIdx >= 0 ? initialIdx : 0;
    setCurrentIndex(targetIdx);

    if (containerRef.current && targetIdx > 0) {
      const container = containerRef.current;
      const setInitialPos = () => {
        if (container && container.clientHeight > 0) {
          container.scrollTo({
            top: targetIdx * container.clientHeight,
            behavior: 'auto',
          });
        }
      };
      requestAnimationFrame(setInitialPos);
      const timer = setTimeout(setInitialPos, 50);
      return () => clearTimeout(timer);
    }
  }, [initialEpisodeNumber, episodes]);

  // Scroll to index helper
  const scrollToIndex = useCallback((index: number, smooth: boolean = true) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.scrollTo({
      top: index * container.clientHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  // Jump to specific episode from drawer or selector
  const handleSelectEpisode = (epNumber: number) => {
    const idx = episodes.findIndex((e) => e.episodeNumber === epNumber);
    if (idx >= 0) {
      if (idx !== currentIndex) {
        adService.incrementWatchCounter(drama.id, epNumber);
      }
      setIsSeriesCompleted(false);
      setCurrentIndex(idx);
      scrollToIndex(idx, true);
    }
  };

  // Scroll handler backup for fast swiping and edge cases
  const handleContainerScroll = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const h = container.clientHeight;
    if (h <= 0) return;
    const idx = Math.round(container.scrollTop / h);
    if (idx >= 0 && idx < episodes.length) {
      if (idx !== currentIndex && !isSeriesCompleted) {
        setCurrentIndex(idx);
      }
    } else if (idx >= episodes.length && !isSeriesCompleted) {
      setIsSeriesCompleted(true);
    }
  }, [currentIndex, episodes.length, isSeriesCompleted]);

  // IntersectionObserver for detecting active episode during manual swipe
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(index)) {
              if (index < episodes.length) {
                setIsSeriesCompleted(false);
                setCurrentIndex((prev) => {
                  if (prev !== index) {
                    const nextEp = episodes[index];
                    if (nextEp) {
                      adService.incrementWatchCounter(drama.id, nextEp.episodeNumber);
                    }
                    onHaptic('selection' as any);
                    return index;
                  }
                  return prev;
                });
              } else if (index === episodes.length) {
                setIsSeriesCompleted(true);
              }
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.6,
      }
    );

    Array.from(container.children).forEach((child) => {
      if (child instanceof Element) {
        observer.observe(child);
      }
    });

    return () => observer.disconnect();
  }, [episodes.length, onHaptic]);

  // Save Progress as user watches
  const handleProgressUpdate = (episode: Episode, currentTime: number, duration: number) => {
    userProgressRepository.saveProgress(
      drama.id,
      episode.id,
      episode.episodeNumber,
      currentTime,
      duration,
      false
    );
  };

  // Handle End of Episode & Automatic Advance
  const handleEpisodeEnded = useCallback(
    async (episode: Episode) => {
      // Prevent duplicate concurrent transitions
      if (isAutoAdvancingRef.current) return;
      isAutoAdvancingRef.current = true;

      try {
        // 1. Mark current episode as completed
        await userProgressRepository.markEpisodeCompleted(
          drama.id,
          episode.id,
          episode.episodeNumber
        );

        // 2. Check if another episode exists
        const nextIdx = currentIndex + 1;
        if (nextIdx < episodes.length) {
          // Increment ad watch counter in background service abstraction
          adService.incrementWatchCounter(drama.id, episode.episodeNumber);

          // Direct smooth transition to next episode
          setCurrentIndex(nextIdx);
          scrollToIndex(nextIdx, true);
          onHaptic('medium');
        } else {
          // Reached End of Series
          setIsSeriesCompleted(true);
          scrollToIndex(episodes.length, true);
          onHaptic('success');
        }
      } finally {
        setTimeout(() => {
          isAutoAdvancingRef.current = false;
        }, 600);
      }
    },
    [currentIndex, episodes, drama.id, scrollToIndex, onHaptic]
  );

  const handleToggleMyShows = async () => {
    const isAdded = await userProgressRepository.toggleMyShow(drama.id);
    setIsSavedInMyShows(isAdded);
    onHaptic(isAdded ? 'success' : 'light');
  };

  // Keyboard navigation for desktop testing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        if (currentIndex < episodes.length - 1) {
          const next = currentIndex + 1;
          setCurrentIndex(next);
          scrollToIndex(next);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        if (currentIndex > 0) {
          const prev = currentIndex - 1;
          setCurrentIndex(prev);
          scrollToIndex(prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, episodes.length, scrollToIndex]);

  const currentEp = episodes[currentIndex];

  return (
    <div className="fixed inset-0 z-40 bg-black text-white overflow-hidden flex flex-col">
      {/* Floating Top Navigation Header */}
      <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 pt-safe pb-3 pointer-events-none">
        {/* Back Button */}
        <button
          id="feed-back-btn"
          onClick={onBack}
          className="pointer-events-auto w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 active:scale-90 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Drama Info Header */}
        <div className="pointer-events-auto flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
          <span className="text-xs font-bold text-white truncate max-w-[160px]">
            {drama.title}
          </span>
          <span className="text-xs text-rose-400 font-extrabold">
            {currentIndex + 1}/{episodes.length}
          </span>
        </div>

        {/* Spacer */}
        <div className="w-10" />
      </header>

      {/* Vertical Snap Scroll Feed Container */}
      <main
        ref={containerRef}
        onScroll={handleContainerScroll}
        className="flex-1 w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
        }}
      >
        {episodes.map((ep, idx) => (
          <section
            key={ep.id}
            data-index={idx}
            className="w-full h-full snap-start snap-always shrink-0 relative"
            style={{ height: '100dvh' }}
          >
            <EpisodePlayerItem
              episode={ep}
              drama={drama}
              isActive={idx === currentIndex && !isSeriesCompleted}
              isPreload={idx === currentIndex + 1}
              isMuted={isMuted}
              playbackSpeed={playbackSpeed}
              quality={quality}
              isSavedInMyShows={isSavedInMyShows}
              onToggleMyShows={handleToggleMyShows}
              onToggleMute={() => setIsMuted(!isMuted)}
              onOpenEpisodesDrawer={() => setIsEpisodesDrawerOpen(true)}
              onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
              onEpisodeEnded={handleEpisodeEnded}
              onProgressUpdate={handleProgressUpdate}
              onHaptic={onHaptic}
            />
          </section>
        ))}

        {/* End of Series Final Card (Appears after the last episode) */}
        <section
          data-index={episodes.length}
          className="w-full h-full snap-start snap-always shrink-0 relative bg-gradient-to-b from-[#12131a] to-black flex flex-col items-center justify-center p-6 text-center space-y-5"
          style={{ height: '100dvh' }}
        >
          <div className="w-20 h-20 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shadow-2xl shadow-rose-500/20">
            <Award className="w-10 h-10 text-rose-500" />
          </div>

          <div className="space-y-2 max-w-xs">
            <h2 className="text-2xl font-black text-white font-display">
              Series Completed!
            </h2>
            <p className="text-xs text-white/60 leading-relaxed">
              You’ve finished all {drama.totalEpisodes} episodes of{' '}
              <span className="text-white font-semibold">{drama.title}</span>.
            </p>
          </div>

          <div className="flex flex-col w-full max-w-xs gap-3 pt-4">
            <button
              id="replay-series-btn"
              onClick={() => {
                setIsSeriesCompleted(false);
                setCurrentIndex(0);
                scrollToIndex(0, true);
              }}
              className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-rose-600/30 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Replay from Episode 1</span>
            </button>

            <button
              id="return-home-series-btn"
              onClick={onBack}
              className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-semibold text-sm flex items-center justify-center space-x-2 border border-white/10 transition-all"
            >
              <Home className="w-4 h-4" />
              <span>Browse More Dramas</span>
            </button>
          </div>
        </section>
      </main>

      {/* Episode Drawer */}
      <EpisodeDrawer
        isOpen={isEpisodesDrawerOpen}
        onClose={() => setIsEpisodesDrawerOpen(false)}
        episodes={episodes}
        currentEpisodeNumber={currentIndex + 1}
        onSelectEpisode={handleSelectEpisode}
        dramaTitle={drama.title}
        dramaCover={drama.coverImage || drama.poster}
      />

      {/* Settings Modal */}
      <PlayerSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        playbackSpeed={playbackSpeed}
        onSelectSpeed={setPlaybackSpeed}
        quality={quality}
        onSelectQuality={setQuality}
        availableQualities={currentEp?.availableQualities?.map((q) => q.label) || ['1080p', '720p', '480p']}
      />
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Play,
  Star,
  Bookmark,
  BookmarkCheck,
  Share2,
  CheckCircle2,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  Flame,
  Lock,
} from 'lucide-react';
import { Drama, Episode, UserProgress } from '../../types';
import { userProgressRepository } from '../../repositories/userProgressRepository';
import { dramaRepository } from '../../repositories/dramaRepository';
import { adService } from '../../services/adService';
import { DramaCover } from '../common/DramaCover';

interface DramaDetailModalProps {
  drama: Drama | null;
  isOpen: boolean;
  onClose: () => void;
  onStartWatch: (drama: Drama, episodeNumber?: number) => void;
  onHaptic: (type?: 'light' | 'medium' | 'heavy' | 'success') => void;
}

export const DramaDetailModal: React.FC<DramaDetailModalProps> = ({
  drama,
  isOpen,
  onClose,
  onStartWatch,
  onHaptic,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [liveEpisodes, setLiveEpisodes] = useState<Episode[]>([]);

  useEffect(() => {
    if (drama && isOpen) {
      userProgressRepository.isMyShow(drama.id).then(setIsSaved);
      userProgressRepository.getProgress(drama.id).then(setProgress);

      // Subscribe to real-time episodes from Firestore
      const unsubscribe = dramaRepository.subscribeEpisodes(drama.id, (eps) => {
        if (eps && eps.length > 0) {
          setLiveEpisodes(eps);
        } else if (drama.episodes) {
          setLiveEpisodes(drama.episodes);
        }
      });

      return () => unsubscribe();
    }
  }, [drama, isOpen]);

  if (!drama) return null;

  const handleToggleSave = async () => {
    const nextSaved = await userProgressRepository.toggleMyShow(drama.id);
    setIsSaved(nextSaved);
    onHaptic(nextSaved ? 'success' : 'light');
  };

  const handleShare = () => {
    onHaptic('light');
    if (navigator.share) {
      navigator.share({
        title: drama.title,
        text: `Watch ${drama.title} on VELA Drama!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  const episodes = liveEpisodes.length > 0 ? liveEpisodes : (drama.episodes || []);
  const resumeEpisodeNumber = progress?.episodeNumber || 1;

  const dramaWithLiveEpisodes: Drama = {
    ...drama,
    episodes,
    totalEpisodes: episodes.length || drama.totalEpisodes,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Drama Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="relative z-10 w-full max-h-[92vh] bg-[#0f1117] rounded-t-[32px] border-t border-white/10 flex flex-col overflow-hidden text-white"
          >
            {/* Top Close Bar */}
            <div className="absolute top-4 right-4 z-20">
              <button
                id="close-drama-detail-btn"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/90 active:scale-95 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Container */}
            <div className="overflow-y-auto no-scrollbar flex-1 pb-safe">
              {/* Backdrop Header */}
              <div className="relative aspect-[16/10] w-full bg-[#161820]">
                <DramaCover
                  src={drama.coverImage || drama.poster || drama.backdrop}
                  alt={drama.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-[#0f1117]/40 to-transparent" />

                {/* Cover Poster floating in corner */}
                <div className="absolute -bottom-4 left-5 flex space-x-3.5 items-end">
                  <div className="w-24 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
                    <DramaCover
                      src={drama.coverImage || drama.poster}
                      alt={drama.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Main Metadata */}
              <div className="p-5 pt-8 space-y-4">
                {/* Title & Status */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-rose-600/30 text-rose-400 border border-rose-500/40">
                      {drama.status}
                    </span>
                    {drama.trending && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                        <Flame className="w-3 h-3 fill-amber-300" />
                        <span>Trending</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-extrabold text-white tracking-tight font-display">
                    {drama.title}
                  </h3>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center space-x-4 text-xs text-white/60">
                  <div className="flex items-center space-x-1 text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="font-bold">{drama.rating || '4.9'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{(drama.viewsCount || 50000).toLocaleString()} views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{episodes.length} Episodes</span>
                  </div>
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-1.5">
                  {drama.genres.map((genre) => (
                    <span
                      key={genre}
                      className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/80"
                    >
                      {genre}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2.5 pt-2">
                  <button
                    id="detail-watch-now-btn"
                    onClick={() => {
                      onStartWatch(dramaWithLiveEpisodes, resumeEpisodeNumber);
                    }}
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 active:scale-95 text-white font-extrabold text-sm flex items-center justify-center space-x-2 shadow-xl shadow-rose-600/30 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>
                      {progress && progress.episodeNumber > 1
                        ? `RESUME EPISODE ${progress.episodeNumber}`
                        : 'WATCH EPISODE 1'}
                    </span>
                  </button>

                  <button
                    id="detail-toggle-saved-btn"
                    onClick={handleToggleSave}
                    className={`py-3.5 px-4 rounded-2xl border active:scale-95 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer ${
                      isSaved
                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                        : 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 text-white" />
                        <span>Save</span>
                      </>
                    )}
                  </button>

                  <button
                    id="detail-share-btn"
                    onClick={handleShare}
                    className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/15 flex items-center justify-center text-white transition-all cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Synopsis */}
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Synopsis
                  </h4>
                  <p className="text-xs text-white/80 leading-relaxed">
                    {drama.description}
                  </p>
                </div>

                {/* Episodes Grid/List */}
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">
                      Episodes ({episodes.length})
                    </h4>
                    <span className="text-[11px] text-white/40">
                      Auto-plays next episode
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {episodes.map((ep) => {
                      const isWatched = progress && progress.episodeNumber >= ep.episodeNumber;
                      const isCurrent = progress && progress.episodeNumber === ep.episodeNumber;
                      const isUnlocked = adService.isEpisodeUnlocked(drama.id, ep.episodeNumber, ep.freeToWatch);

                      return (
                        <div
                          key={ep.id || ep.episodeNumber}
                          id={`episode-row-${ep.episodeNumber}`}
                          onClick={() => {
                            onStartWatch(dramaWithLiveEpisodes, ep.episodeNumber);
                          }}
                          className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${
                            isCurrent
                              ? 'bg-rose-500/15 border-rose-500/40 text-white'
                              : isUnlocked
                              ? 'bg-white/5 border-white/5 hover:bg-white/10 text-white/80'
                              : 'bg-amber-950/20 border-amber-500/20 text-white/80'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="relative w-14 h-11 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10">
                              <img
                                src={ep.thumbnailUrl || ep.thumbnail || drama.coverImage || drama.poster}
                                alt={ep.title}
                                referrerPolicy="no-referrer"
                                className={`w-full h-full object-cover ${!isUnlocked ? 'filter grayscale/40 brightness-75' : ''}`}
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                {isCurrent ? (
                                  <div className="w-5 h-5 rounded-full bg-rose-600 flex items-center justify-center shadow-md">
                                    <Play className="w-2.5 h-2.5 fill-white text-white translate-x-0.5" />
                                  </div>
                                ) : !isUnlocked ? (
                                  <Lock className="w-4 h-4 text-amber-400" />
                                ) : isWatched ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <span className="text-[10px] font-black text-white px-1 py-0.5 rounded bg-black/60 backdrop-blur-xs">
                                    {ep.episodeNumber}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center space-x-1.5">
                                <p className={`text-xs font-bold truncate ${isCurrent ? 'text-rose-400' : 'text-white'}`}>
                                  {ep.title}
                                </p>
                                {!isUnlocked && (
                                  <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                                    Locked
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-white/40 truncate">
                                {ep.duration ? `${Math.floor(ep.duration / 60)}m ${ep.duration % 60}s` : '1 min'} • HD
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {!isUnlocked ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Ad Unlock</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/70">
                                HD
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, CheckCircle2, Lock, Sparkles, Loader2 } from 'lucide-react';
import { Episode } from '../../types';
import { adService } from '../../services/adService';

interface EpisodeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  episodes: Episode[];
  currentEpisodeNumber: number;
  onSelectEpisode: (episodeNumber: number) => void;
  dramaTitle: string;
  dramaId: string;
  dramaCover?: string;
  onHaptic?: (type?: 'light' | 'medium' | 'heavy' | 'selection' | 'success') => void;
}

export const EpisodeDrawer: React.FC<EpisodeDrawerProps> = ({
  isOpen,
  onClose,
  episodes,
  currentEpisodeNumber,
  onSelectEpisode,
  dramaTitle,
  dramaId,
  dramaCover,
  onHaptic,
}) => {
  const [unlockingEpNumber, setUnlockingEpNumber] = useState<number | null>(null);

  const handleUnlockWithAd = async (e: React.MouseEvent, epNumber: number) => {
    e.stopPropagation();
    if (unlockingEpNumber !== null) return;
    setUnlockingEpNumber(epNumber);
    onHaptic?.('medium');

    try {
      const res = await adService.unlockEpisodeWithRewardedAd(dramaId, epNumber);
      if (res.success) {
        onHaptic?.('success');
        onSelectEpisode(epNumber);
        onClose();
      } else {
        onHaptic?.('heavy');
      }
    } catch (err) {
      console.error('[EpisodeDrawer] Failed to unlock episode via ad:', err);
    } finally {
      setUnlockingEpNumber(null);
    }
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
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Drawer Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 w-full max-h-[75vh] bg-[#12141a] rounded-t-3xl border-t border-white/10 flex flex-col overflow-hidden pb-safe"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div>
                <h3 className="font-bold text-white text-base truncate max-w-[260px]">
                  {dramaTitle}
                </h3>
                <p className="text-xs text-white/50">
                  {episodes.length} Episodes Total
                </p>
              </div>
              <button
                id="close-episode-drawer-btn"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Episode Grid / List */}
            <div className="overflow-y-auto p-4 space-y-2.5 max-h-[60vh] no-scrollbar">
              {episodes.map((ep) => {
                const isActive = ep.episodeNumber === currentEpisodeNumber;
                const isCompleted = ep.episodeNumber < currentEpisodeNumber;
                const isUnlocked = adService.isEpisodeUnlocked(dramaId, ep.episodeNumber, ep.freeToWatch);
                const isUnlockingThis = unlockingEpNumber === ep.episodeNumber;

                return (
                  <div
                    key={ep.id}
                    id={`drawer-ep-btn-${ep.episodeNumber}`}
                    onClick={() => {
                      if (!isUnlocked) {
                        return;
                      }
                      onSelectEpisode(ep.episodeNumber);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                      isActive
                        ? 'bg-rose-500/15 border-rose-500/50 text-white'
                        : isUnlocked
                        ? 'bg-white/5 border-white/5 text-white/80 hover:bg-white/10 cursor-pointer'
                        : 'bg-amber-950/20 border-amber-500/20 text-white/90'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="relative w-14 h-11 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10">
                        <img
                          src={ep.thumbnailUrl || ep.thumbnail || dramaCover}
                          alt={ep.title}
                          referrerPolicy="no-referrer"
                          className={`w-full h-full object-cover ${!isUnlocked ? 'filter grayscale/50 brightness-75' : ''}`}
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          {isActive ? (
                            <Play className="w-3.5 h-3.5 fill-white text-white translate-x-0.5" />
                          ) : !isUnlocked ? (
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <span className="text-[10px] font-black text-white px-1 py-0.5 rounded bg-black/60 backdrop-blur-xs">
                              {ep.episodeNumber}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center space-x-1.5">
                          <p className={`text-sm font-semibold truncate ${isActive ? 'text-rose-400' : 'text-white'}`}>
                            {ep.title}
                          </p>
                          {!isUnlocked && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                              Locked
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/40 truncate">
                          {ep.duration ? `${Math.floor(ep.duration / 60)}m ${ep.duration % 60}s` : '1 min'} • HD
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center space-x-2">
                      {isActive && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/30 text-rose-300 border border-rose-500/40">
                          Playing
                        </span>
                      )}

                      {!isUnlocked && (
                        <button
                          id={`drawer-unlock-ep-${ep.episodeNumber}-btn`}
                          onClick={(e) => handleUnlockWithAd(e, ep.episodeNumber)}
                          disabled={unlockingEpNumber !== null}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-extrabold text-xs flex items-center space-x-1 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                        >
                          {isUnlockingThis ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Loading...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 text-amber-200 fill-amber-200" />
                              <span>Watch Ad to Unlock</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

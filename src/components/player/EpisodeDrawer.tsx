import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, CheckCircle2, Lock, Sparkles, Loader2, Coins, AlertCircle } from 'lucide-react';
import { Episode } from '../../types';
import { adService, COIN_UNLOCK_COST } from '../../services/adService';

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
  const [coins, setCoins] = useState<number>(() => adService.getUserCoins());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = adService.onCoinsListener((newCoins) => {
      setCoins(newCoins);
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleUnlockWithCoins = (e: React.MouseEvent, epNumber: number) => {
    e.stopPropagation();
    if (unlockingEpNumber !== null) return;

    if (coins < COIN_UNLOCK_COST) {
      onHaptic?.('heavy');
      showToast('Not enough coins! You need 20 coins. Claim Daily Reward to get +50 coins.');
      return;
    }

    onHaptic?.('medium');
    const res = adService.unlockEpisodeWithCoins(dramaId, epNumber, COIN_UNLOCK_COST);
    if (res.success) {
      onHaptic?.('success');
      onSelectEpisode(epNumber);
      onClose();
    } else {
      onHaptic?.('heavy');
      showToast(res.error || 'Not enough coins! You need 20 coins. Claim Daily Reward to get +50 coins.');
    }
  };

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
            className="relative z-10 w-full max-h-[82vh] bg-[#12141a] rounded-t-3xl border-t border-white/10 flex flex-col overflow-hidden pb-safe"
          >
            {/* Toast Alert Notice */}
            {toastMessage && (
              <div className="absolute top-3 left-4 right-4 z-30 p-3 rounded-2xl bg-rose-600/95 backdrop-blur-md text-white text-xs font-bold shadow-2xl border border-rose-400 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-300" />
                  <span className="leading-snug">{toastMessage}</span>
                </div>
                <button
                  onClick={() => setToastMessage(null)}
                  className="p-1 rounded-full bg-white/20 text-white hover:bg-white/30"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div>
                <h3 className="font-bold text-white text-base truncate max-w-[220px]">
                  {dramaTitle}
                </h3>
                <p className="text-xs text-white/50">
                  {episodes.length} Episodes Total
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {/* Coins Badge in Drawer */}
                <div className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center space-x-1.5 text-amber-300">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-black font-display">{coins}</span>
                </div>

                <button
                  id="close-episode-drawer-btn"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Episode Grid / List */}
            <div className="overflow-y-auto p-4 space-y-2.5 max-h-[65vh] no-scrollbar">
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

                    <div className="shrink-0 flex items-center space-x-1.5">
                      {isActive && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/30 text-rose-300 border border-rose-500/40">
                          Playing
                        </span>
                      )}

                      {!isUnlocked && (
                        <>
                          {/* Unlock with 20 Coins Option */}
                          <button
                            id={`drawer-unlock-coins-ep-${ep.episodeNumber}-btn`}
                            onClick={(e) => handleUnlockWithCoins(e, ep.episodeNumber)}
                            disabled={unlockingEpNumber !== null}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-extrabold text-[11px] flex items-center space-x-1 border border-amber-500/40 shadow-sm active:scale-95 transition-all cursor-pointer"
                            title="Unlock with 20 Coins"
                          >
                            <Coins className="w-3 h-3 text-amber-400" />
                            <span>20 Coins</span>
                          </button>

                          {/* Watch Ad to Unlock Option */}
                          <button
                            id={`drawer-unlock-ad-ep-${ep.episodeNumber}-btn`}
                            onClick={(e) => handleUnlockWithAd(e, ep.episodeNumber)}
                            disabled={unlockingEpNumber !== null}
                            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-extrabold text-[11px] flex items-center space-x-1 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                            title="Watch Ad to Unlock"
                          >
                            {isUnlockingThis ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Ad...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 text-amber-200 fill-amber-200" />
                                <span>Watch Ad</span>
                              </>
                            )}
                          </button>
                        </>
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

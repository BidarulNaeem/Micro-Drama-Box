import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Clock } from 'lucide-react';

interface AdPlaceholderOverlayProps {
  isOpen: boolean;
  episodeNumber: number;
  onAdFinished: () => void;
}

/**
 * Modular Monetag Ad Interstitial Interface Overlay.
 * In Phase 1: Provides a seamless, clean transition state showing the ad trigger lifecycle.
 * In Phase 2: Monetag SDK is injected here via adService.requestInterstitialAd.
 */
export const AdPlaceholderOverlay: React.FC<AdPlaceholderOverlayProps> = ({
  isOpen,
  episodeNumber,
  onAdFinished,
}) => {
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(2);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onAdFinished();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onAdFinished]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="ad-interstitial-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 text-white p-6 backdrop-blur-md"
        >
          {/* Top Bar */}
          <div className="w-full flex items-center justify-between pt-safe">
            <div className="flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full border border-white/15 text-xs text-amber-300 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sponsor Break</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-white/60 bg-white/5 px-2.5 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              <span>Starting Ep. {episodeNumber + 1} in {countdown}s</span>
            </div>
          </div>

          {/* Central Card */}
          <div className="flex flex-col items-center text-center max-w-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 border border-white/10 flex items-center justify-center shadow-lg shadow-rose-500/5">
              <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white font-display">
                Monetag Ad Break
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Ad interval triggered (Every 3 Episodes). Monetag Mini App SDK integration point configured.
              </p>
            </div>
            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, ease: 'linear' }}
              />
            </div>
          </div>

          {/* Bottom Button */}
          <div className="w-full pb-safe">
            <button
              id="skip-ad-placeholder-btn"
              onClick={onAdFinished}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-semibold text-xs tracking-wider uppercase border border-white/10 transition-colors"
            >
              Skip to Next Episode
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

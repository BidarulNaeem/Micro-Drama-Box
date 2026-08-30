import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gauge, Sparkles, Sliders, ShieldCheck } from 'lucide-react';
import { adService } from '../../services/adService';

interface PlayerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playbackSpeed: number;
  onSelectSpeed: (speed: number) => void;
  quality: string;
  onSelectQuality: (quality: string) => void;
  availableQualities: string[];
}

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 2.0];

export const PlayerSettingsModal: React.FC<PlayerSettingsModalProps> = ({
  isOpen,
  onClose,
  playbackSpeed,
  onSelectSpeed,
  quality,
  onSelectQuality,
  availableQualities,
}) => {
  const adConfig = adService.getConfig();

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
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Settings Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 w-full max-h-[80vh] bg-[#13151c] rounded-t-3xl border-t border-white/10 p-5 space-y-5 pb-safe text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-base">Playback Settings</h3>
              </div>
              <button
                id="close-player-settings-btn"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Playback Speed Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span className="flex items-center space-x-1.5 font-medium">
                  <Gauge className="w-3.5 h-3.5 text-rose-400" />
                  <span>Playback Speed</span>
                </span>
                <span className="font-bold text-rose-400">{playbackSpeed}x</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    id={`speed-btn-${s}`}
                    onClick={() => onSelectSpeed(s)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      playbackSpeed === s
                        ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Video Quality Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span className="flex items-center space-x-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Stream Quality</span>
                </span>
                <span className="font-bold text-amber-400">{quality}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['1080p', '720p', '480p'].map((q) => (
                  <button
                    key={q}
                    id={`quality-btn-${q}`}
                    onClick={() => onSelectQuality(q)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      quality === q
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/20'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {q} {q === '1080p' ? 'Full HD' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Architecture / Monetag Trigger Status */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5 text-xs text-white/60">
              <div className="flex items-center space-x-1.5 text-white/80 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Architecture Diagnostics</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Automatic ad interval is set to every <strong className="text-white">{adConfig.adEpisodeInterval} episodes</strong> with a <strong className="text-white">5-minute cooldown</strong> timer.
                HLS master playlist and Cloudflare R2 adapters are active.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

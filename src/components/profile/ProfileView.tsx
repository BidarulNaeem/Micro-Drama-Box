import React, { useState, useEffect } from 'react';
import {
  User,
  Sparkles,
  Sliders,
  Tv,
  CheckCircle,
  Clock,
  Shield,
  Layers,
  Smartphone,
  Info,
  Database,
  ArrowRight,
  Lock,
  KeyRound,
} from 'lucide-react';
import { TelegramUser, UserPreferences } from '../../types';
import { userProgressRepository } from '../../repositories/userProgressRepository';
import { adService } from '../../services/adService';
import { videoService } from '../../services/videoService';

interface ProfileViewProps {
  user: TelegramUser | null;
  isTelegram: boolean;
  onOpenAdmin?: () => void;
  onHaptic: (type?: 'light' | 'medium' | 'heavy' | 'selection' | 'success') => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  isTelegram,
  onOpenAdmin,
  onHaptic,
}) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    autoPlayNext: true,
    defaultQuality: '1080p',
    hapticFeedbackEnabled: true,
    mutedByDefault: false,
  });

  const [stats, setStats] = useState({
    historyCount: 0,
    savedCount: 0,
    completedCount: 0,
  });

  const [adInterval, setAdInterval] = useState(adService.getConfig().adEpisodeInterval);
  const [r2Url, setR2Url] = useState(videoService.getCloudflareR2BaseUrl());

  useEffect(() => {
    userProgressRepository.getPreferences().then(setPreferences);
    Promise.all([
      userProgressRepository.getAllHistory(),
      userProgressRepository.getMyShows(),
    ]).then(([history, saved]) => {
      setStats({
        historyCount: history.length,
        savedCount: saved.length,
        completedCount: history.filter((h) => h.completed).length,
      });
    });
  }, []);

  const handleTogglePref = async (key: keyof UserPreferences) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    await userProgressRepository.savePreferences(updated);
    onHaptic('light');
  };

  const handleQualityChange = async (quality: string) => {
    const updated = { ...preferences, defaultQuality: quality };
    setPreferences(updated);
    await userProgressRepository.savePreferences(updated);
    onHaptic('selection');
  };

  const handleUpdateAdInterval = (interval: number) => {
    adService.setAdEpisodeInterval(interval);
    setAdInterval(interval);
    onHaptic('selection');
  };

  return (
    <div className="space-y-5">
      {/* Header Profile Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#181a24] to-[#10121a] border border-white/10 relative overflow-hidden">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 p-0.5 shadow-xl shadow-rose-600/20 shrink-0">
            <div className="w-full h-full rounded-2xl bg-[#0d0f15] overflow-hidden flex items-center justify-center">
              {user?.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.firstName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-white/80" />
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-black text-lg text-white truncate font-display">
                {user?.firstName || 'Vela Explorer'} {user?.lastName || ''}
              </h3>
              {user?.isPremium && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-extrabold flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 fill-amber-300" />
                  <span>VIP</span>
                </span>
              )}
            </div>

            <p className="text-xs text-white/50 truncate">
              {user?.username ? `@${user.username}` : 'Short Drama Aficionado'}
            </p>

            <div className="pt-1 flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{isTelegram ? 'Telegram Mini App' : 'Web Live'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Panel Access Card with PIN Verification */}
      {onOpenAdmin && (
        <div
          id="profile-admin-panel-card"
          onClick={onOpenAdmin}
          className="p-4 rounded-3xl bg-gradient-to-r from-rose-950/40 via-[#181a24] to-[#12141c] border border-rose-500/30 hover:border-rose-500/50 transition-all cursor-pointer flex items-center justify-between active:scale-[0.99] group shadow-lg shadow-rose-950/30"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-bold text-white">Firestore Admin Panel</h4>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-500/20 border border-rose-500/40 text-rose-300 uppercase tracking-wider flex items-center space-x-0.5">
                  <KeyRound className="w-2.5 h-2.5 inline mr-0.5" />
                  <span>PIN Protected</span>
                </span>
              </div>
              <p className="text-xs text-white/50">Manage dramas, Cloudflare R2 episodes & database</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
        </div>
      )}

      {/* User Watch Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-[#12141c] border border-white/5 text-center space-y-1">
          <p className="text-lg font-black text-rose-500 font-display">
            {stats.historyCount}
          </p>
          <p className="text-[10px] text-white/50 font-medium">In Progress</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#12141c] border border-white/5 text-center space-y-1">
          <p className="text-lg font-black text-amber-400 font-display">
            {stats.savedCount}
          </p>
          <p className="text-[10px] text-white/50 font-medium">My Shows</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#12141c] border border-white/5 text-center space-y-1">
          <p className="text-lg font-black text-emerald-400 font-display">
            {stats.completedCount}
          </p>
          <p className="text-[10px] text-white/50 font-medium">Completed</p>
        </div>
      </div>

      {/* Playback Preferences */}
      <div className="p-4 rounded-3xl bg-[#12141c] border border-white/5 space-y-4">
        <div className="flex items-center space-x-2 border-b border-white/5 pb-2.5">
          <Sliders className="w-4 h-4 text-rose-500" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-white/80">
            Player Preferences
          </h4>
        </div>

        <div className="space-y-3">
          {/* Auto Play Next */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-white">Auto-Advance Next Episode</p>
              <p className="text-[11px] text-white/40">Smooth transition when episode ends</p>
            </div>
            <button
              id="pref-toggle-autoplay"
              onClick={() => handleTogglePref('autoPlayNext')}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                preferences.autoPlayNext ? 'bg-rose-600' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  preferences.autoPlayNext ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Default Quality */}
          <div className="pt-2 border-t border-white/5 space-y-2">
            <p className="text-xs font-semibold text-white">Default Quality</p>
            <div className="grid grid-cols-3 gap-2">
              {['1080p', '720p', '480p'].map((q) => (
                <button
                  key={q}
                  id={`pref-quality-${q}`}
                  onClick={() => handleQualityChange(q)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    preferences.defaultQuality === q
                      ? 'bg-rose-600/30 border-rose-500 text-white'
                      : 'bg-white/5 border-white/10 text-white/60'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Monetization & Backend Architecture Diagnostics */}
      <div className="p-4 rounded-3xl bg-[#12141c] border border-white/5 space-y-3 text-xs">
        <div className="flex items-center space-x-2 border-b border-white/5 pb-2.5">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-white/80">
            Cloudflare R2 & Firestore Architecture
          </h4>
        </div>

        {/* Ad Interval Configuration */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-white/80">
            <span>Ad Interstitial Trigger Interval:</span>
            <span className="font-bold text-amber-400">Every {adInterval} Episodes</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[2, 3, 4, 5].map((num) => (
              <button
                key={num}
                id={`ad-interval-${num}`}
                onClick={() => handleUpdateAdInterval(num)}
                className={`py-1.5 rounded-lg text-[11px] font-bold border ${
                  adInterval === num
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-white/5 border-white/10 text-white/60'
                }`}
              >
                Every {num}
              </button>
            ))}
          </div>
        </div>

        {/* Cloudflare R2 / HLS Stream note */}
        <div className="pt-2 border-t border-white/5 space-y-1 text-white/60 text-[11px]">
          <p className="font-semibold text-white/80">Cloudflare R2 & Live Firestore:</p>
          <p className="leading-relaxed">
            Connected to Firestore <code className="text-rose-400 font-mono">vela-drama-8f277</code> with real-time listeners.
          </p>
        </div>
      </div>
    </div>
  );
};

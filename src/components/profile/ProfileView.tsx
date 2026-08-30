import React, { useState, useEffect, useRef } from 'react';
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
  Coins,
  Gift,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
} from 'lucide-react';
import { TelegramUser, UserPreferences } from '../../types';
import { userProgressRepository } from '../../repositories/userProgressRepository';
import { adService, DAILY_REWARD_MIN_WATCH_SECONDS } from '../../services/adService';
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

  const [coins, setCoins] = useState<number>(() => adService.getUserCoins());
  const [isClaimingBonus, setIsClaimingBonus] = useState(false);
  const [bonusRewardSuccess, setBonusRewardSuccess] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ad modal and countdown state
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [adWatchRemaining, setAdWatchRemaining] = useState(DAILY_REWARD_MIN_WATCH_SECONDS);
  const [adStartTime, setAdStartTime] = useState<number | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [adInterval, setAdInterval] = useState(adService.getConfig().adEpisodeInterval);
  const [r2Url, setR2Url] = useState(videoService.getCloudflareR2BaseUrl());

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

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

    const unsubscribeCoins = adService.onCoinsListener((newCoins) => {
      setCoins(newCoins);
    });

    return () => {
      unsubscribeCoins();
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Countdown timer effect for active Daily Reward Ad session
  useEffect(() => {
    if (!isAdModalOpen || adStartTime === null) {
      return;
    }

    const interval = setInterval(() => {
      setAdWatchRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Verify with adService (min 25s requirement)
          const result = adService.verifyAndClaimDailyBonus(adStartTime, 50, DAILY_REWARD_MIN_WATCH_SECONDS);
          setIsAdModalOpen(false);
          setIsClaimingBonus(false);

          if (result.success) {
            onHaptic('success');
            setBonusRewardSuccess(result.coinsAwarded);
            showToast('+50 VIP Coins claimed successfully!');
            setTimeout(() => {
              setBonusRewardSuccess(null);
            }, 5000);
          } else {
            onHaptic('heavy');
            showToast(result.error || 'Reward failed! You must watch the ad for at least 25 seconds to claim your 50 coins.');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAdModalOpen, adStartTime, onHaptic]);

  const handleStartClaimReward = () => {
    if (isClaimingBonus || isAdModalOpen) return;
    setIsClaimingBonus(true);
    setToastMessage(null);
    setBonusRewardSuccess(null);
    onHaptic('medium');

    // Launch Monetag ad and start tracking timestamp
    const session = adService.startDailyRewardSession(50);
    setAdStartTime(session.startTime);
    setAdWatchRemaining(DAILY_REWARD_MIN_WATCH_SECONDS);
    setIsAdModalOpen(true);
  };

  const handleCancelAdEarly = () => {
    // If cancelled before 25 seconds
    setIsAdModalOpen(false);
    setIsClaimingBonus(false);
    onHaptic('heavy');
    showToast('Reward failed! You must watch the ad for at least 25 seconds to claim your 50 coins.');
  };

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
    <div className="space-y-5 relative">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-600/95 backdrop-blur-md text-white text-xs font-bold shadow-2xl border border-rose-400 flex items-center justify-between animate-in fade-in slide-in-from-top-2 z-30">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-300" />
            <span className="leading-snug">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-full bg-white/20 text-white hover:bg-white/30 ml-2 shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
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

      {/* Rewarded Popup Bonus & Coins Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/40 via-[#1c1822] to-[#12141c] border border-amber-500/30 relative overflow-hidden shadow-xl shadow-amber-950/20">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Coins className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300/80">
                Your VIP Balance
              </p>
              <h4 className="text-xl font-black text-white font-display flex items-center space-x-1.5">
                <span>{coins}</span>
                <span className="text-xs font-bold text-amber-400">Coins</span>
              </h4>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center space-x-1">
            <Gift className="w-3.5 h-3.5" />
            <span>Daily Bonus</span>
          </div>
        </div>

        {bonusRewardSuccess !== null ? (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center space-x-2.5 text-emerald-300 text-xs font-bold animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Successfully claimed +{bonusRewardSuccess} Coins from sponsored reward!</span>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-white/70 leading-relaxed">
              Watch a quick 25-second sponsored ad popup to claim 50 VIP Coins for unlocking premium episodes!
            </p>
            <button
              id="profile-claim-reward-btn"
              onClick={handleStartClaimReward}
              disabled={isClaimingBonus}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 active:scale-95 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer border border-amber-400/30"
            >
              {isClaimingBonus ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Watching Sponsored Ad ({adWatchRemaining}s)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200" />
                  <span>CLAIM DAILY REWARD (+50 COINS)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Fullscreen Ad Verification Modal (25-Second Watch Requirement) */}
      {isAdModalOpen && (
        <div
          id="daily-reward-ad-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
        >
          <div className="relative w-full max-w-sm rounded-3xl bg-[#12141d] border border-amber-500/40 p-6 shadow-2xl shadow-amber-950/50 flex flex-col items-center text-center space-y-4">
            {/* Header Badge */}
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 fill-amber-300" />
              <span>Sponsored Reward Ad</span>
            </div>

            {/* Title & Icon */}
            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-white font-display">
                Watching Sponsored Ad
              </h3>
              <p className="text-xs text-white/60 leading-relaxed px-2">
                Monetag Pop Ad active. Watch for at least 25 seconds to verify and claim your +50 VIP Coins.
              </p>
            </div>

            {/* 25-Second Countdown Timer Circle / Box */}
            <div className="relative w-28 h-28 flex items-center justify-center my-2">
              <div className="absolute inset-0 rounded-full border-4 border-white/10" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500/20 to-rose-500/20 border-2 border-amber-400/60 flex flex-col items-center justify-center shadow-lg shadow-amber-500/20">
                <Clock className="w-5 h-5 text-amber-400 mb-0.5 animate-pulse" />
                <span className="text-2xl font-black text-white font-display">
                  {adWatchRemaining}s
                </span>
              </div>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full space-y-1.5">
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-amber-500 transition-all duration-1000 ease-linear rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, ((DAILY_REWARD_MIN_WATCH_SECONDS - adWatchRemaining) / DAILY_REWARD_MIN_WATCH_SECONDS) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/40 font-semibold px-1">
                <span>0s</span>
                <span className="text-amber-300">Min 25s required</span>
                <span>25s</span>
              </div>
            </div>

            {/* Warning Note */}
            <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/20 flex items-start space-x-2 text-left">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-200/80 leading-snug">
                Closing or skipping before 25 seconds will cancel verification and forfeit your reward.
              </p>
            </div>

            {/* Cancel Early Button */}
            <button
              id="cancel-ad-watch-btn"
              onClick={handleCancelAdEarly}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/70 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 active:scale-98"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel & Close Ad (Forfeit Coins)</span>
            </button>
          </div>
        </div>
      )}

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
            Monetag Monetization & Architecture
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
          <p className="font-semibold text-white/80">Monetag SDK & Cloudflare R2:</p>
          <p className="leading-relaxed">
            Zone <code className="text-amber-400 font-mono">11683116</code> active with In-App Interstitial, Rewarded Interstitial, and Rewarded Popup format bindings.
          </p>
        </div>
      </div>
    </div>
  );
};

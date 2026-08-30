import { AdConfig, AdTriggerEvent } from '../types';

// Global Window interface extension for Monetag SDK
declare global {
  interface Window {
    show_11683116?: ((options?: any) => Promise<any> | void) & ((format?: string) => Promise<any>);
  }
}

export interface AdResult {
  shown: boolean;
  skipped: boolean;
  error?: string;
  durationMs?: number;
}

export interface IAdService {
  getConfig(): AdConfig;
  setConfig(config: Partial<AdConfig>): void;
  setAdEpisodeInterval(interval: number): void;
  getWatchedSinceLastAd(): number;
  incrementWatchCounter(dramaId: string, episodeNumber: number): number;
  shouldTriggerAd(episodeNumber: number): boolean;
  resetCounter(): void;
  initInAppInterstitial(): void;
  triggerMonetagInApp(): void;
  showRewardedInterstitial(): Promise<{ success: boolean; error?: any }>;
  showRewardedPopup(minDurationSeconds?: number): Promise<{ success: boolean; error?: any; elapsedSeconds: number }>;
  unlockEpisodeWithRewardedAd(dramaId: string, episodeNumber: number): Promise<{ success: boolean; error?: any }>;
  unlockEpisodeWithCoins(dramaId: string, episodeNumber: number, cost?: number): { success: boolean; remainingCoins: number; error?: string };
  startDailyRewardSession(bonusAmount?: number): { startTime: number; minDurationSeconds: number; bonusAmount: number };
  verifyAndClaimDailyBonus(startTime: number, bonusAmount?: number, minDurationSeconds?: number): { success: boolean; coinsAwarded: number; newTotal: number; elapsedSeconds: number; error?: string };
  claimDailyBonusWithPopup(bonusAmount?: number, minWatchSeconds?: number): Promise<{ success: boolean; coinsAwarded: number; newTotal: number; elapsedSeconds: number; error?: any }>;
  isEpisodeUnlocked(dramaId: string, episodeNumber: number, freeToWatch?: boolean): boolean;
  unlockEpisode(dramaId: string, episodeNumber: number): void;
  getUnlockedEpisodes(): Record<string, number[]>;
  getUserCoins(): number;
  addCoins(amount: number): number;
  deductCoins(amount: number): boolean;
  requestInterstitialAd(event: AdTriggerEvent): Promise<AdResult>;
  onAdTriggerListener(listener: (event: AdTriggerEvent) => void): () => void;
  onUnlockListener(listener: (dramaId: string, episodeNumber: number) => void): () => void;
  onCoinsListener(listener: (coins: number) => void): () => void;
}

export const AD_EPISODE_INTERVAL = 2; // Shows an ad every 2 episodes
export const COIN_UNLOCK_COST = 20; // 20 coins to unlock a premium episode
export const DAILY_REWARD_MIN_WATCH_SECONDS = 25; // Minimum 25 seconds watch requirement for daily bonus coins

const DEFAULT_CONFIG: AdConfig = {
  adEpisodeInterval: AD_EPISODE_INTERVAL,
  enabled: true,
};

const STORAGE_KEY_WATCH_COUNT = 'dramapulse_ad_watch_counter';
const STORAGE_KEY_AD_CONFIG = 'dramapulse_ad_config';
const STORAGE_KEY_UNLOCKED_EPISODES = 'dramapulse_unlocked_episodes';
const STORAGE_KEY_USER_COINS = 'dramapulse_user_coins';
const DEFAULT_INITIAL_COINS = 100;

class AdService implements IAdService {
  private config: AdConfig;
  private watchedSinceLastAd: number = 0;
  private listeners: Set<(event: AdTriggerEvent) => void> = new Set();
  private unlockListeners: Set<(dramaId: string, episodeNumber: number) => void> = new Set();
  private coinListeners: Set<(coins: number) => void> = new Set();
  private isInAppInitialized: boolean = false;

  constructor() {
    this.config = this.loadConfig();
    this.watchedSinceLastAd = this.loadCounter();
  }

  private loadConfig(): AdConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AD_CONFIG);
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_CONFIG;
  }

  private loadCounter(): number {
    try {
      const val = localStorage.getItem(STORAGE_KEY_WATCH_COUNT);
      return val ? parseInt(val, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  private persistCounter(): void {
    try {
      localStorage.setItem(STORAGE_KEY_WATCH_COUNT, this.watchedSinceLastAd.toString());
    } catch {
      // ignore
    }
  }

  public getConfig(): AdConfig {
    return { ...this.config };
  }

  public setConfig(newConfig: Partial<AdConfig>): void {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEY_AD_CONFIG, JSON.stringify(this.config));
    } catch {
      // ignore
    }
  }

  public setAdEpisodeInterval(interval: number): void {
    this.setConfig({ adEpisodeInterval: interval });
  }

  public getWatchedSinceLastAd(): number {
    return this.watchedSinceLastAd;
  }

  public resetCounter(): void {
    this.watchedSinceLastAd = 0;
    this.persistCounter();
  }

  /**
   * Initializes the Monetag In-App Interstitial format with optimal frequency & capping
   */
  public initInAppInterstitial(): void {
    if (this.isInAppInitialized) return;
    if (typeof window !== 'undefined' && typeof (window as any).show_11683116 === 'function') {
      try {
        (window as any).show_11683116({
          type: 'inApp',
          inAppSettings: {
            frequency: 2,
            capping: 0.1,
            interval: 30,
            timeout: 5,
            everyPage: false,
          },
        });
        this.isInAppInitialized = true;
        console.info('[AdService] Monetag In-App Interstitial initialized (Zone 11683116).');
      } catch (err) {
        console.warn('[AdService] Monetag In-App initialization notice:', err);
      }
    }
  }

  /**
   * Triggers the Monetag In-App Interstitial format directly
   */
  public triggerMonetagInApp(): void {
    if (typeof window !== 'undefined' && typeof (window as any).show_11683116 === 'function') {
      try {
        (window as any).show_11683116({
          type: 'inApp',
          inAppSettings: {
            frequency: 2,
            capping: 0.1,
            interval: 30,
            timeout: 5,
            everyPage: false,
          },
        });
      } catch (err) {
        console.warn('[AdService] Error triggering Monetag In-App ad:', err);
      }
    }
  }

  /**
   * Trigger Rewarded Interstitial ad (e.g. for unlocking premium episodes or bonus rewards)
   */
  public async showRewardedInterstitial(): Promise<{ success: boolean; error?: any }> {
    if (typeof window !== 'undefined' && typeof (window as any).show_11683116 === 'function') {
      try {
        const result = (window as any).show_11683116();
        if (result && typeof result.then === 'function') {
          await result;
        }
        return { success: true };
      } catch (e: any) {
        console.error('[AdService] Monetag Rewarded Interstitial error:', e);
        return { success: false, error: e };
      }
    }
    // Fallback in dev/offline mode
    return { success: true };
  }

  /**
   * Trigger Rewarded Popup ad (e.g. for bonus rewards or instant unlock)
   * Tracks elapsed duration to enforce viewing requirements.
   */
  public async showRewardedPopup(
    minDurationSeconds: number = DAILY_REWARD_MIN_WATCH_SECONDS
  ): Promise<{ success: boolean; error?: any; elapsedSeconds: number }> {
    const startTime = Date.now();
    if (typeof window !== 'undefined' && typeof (window as any).show_11683116 === 'function') {
      return new Promise((resolve) => {
        try {
          const promise = (window as any).show_11683116('pop');
          if (promise && typeof promise.then === 'function') {
            promise
              .then(() => {
                const elapsed = (Date.now() - startTime) / 1000;
                if (elapsed < minDurationSeconds) {
                  resolve({
                    success: false,
                    error: 'Reward failed! You must watch the ad for at least 25 seconds to claim your 50 coins.',
                    elapsedSeconds: Math.floor(elapsed),
                  });
                } else {
                  resolve({ success: true, elapsedSeconds: Math.floor(elapsed) });
                }
              })
              .catch((e: any) => {
                console.error('[AdService] Monetag Rewarded Popup error:', e);
                const elapsed = (Date.now() - startTime) / 1000;
                resolve({ success: false, error: e, elapsedSeconds: Math.floor(elapsed) });
              });
          } else {
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed < minDurationSeconds) {
              resolve({
                success: false,
                error: 'Reward failed! You must watch the ad for at least 25 seconds to claim your 50 coins.',
                elapsedSeconds: Math.floor(elapsed),
              });
            } else {
              resolve({ success: true, elapsedSeconds: Math.floor(elapsed) });
            }
          }
        } catch (e: any) {
          console.error('[AdService] Monetag Rewarded Popup exception:', e);
          const elapsed = (Date.now() - startTime) / 1000;
          resolve({ success: false, error: e, elapsedSeconds: Math.floor(elapsed) });
        }
      });
    }
    const elapsed = (Date.now() - startTime) / 1000;
    return { success: elapsed >= minDurationSeconds, elapsedSeconds: Math.floor(elapsed) };
  }

  /**
   * Increments the persistent watch counter and triggers ad if threshold is reached
   */
  public incrementWatchCounter(dramaId: string, episodeNumber: number): number {
    this.watchedSinceLastAd += 1;
    this.persistCounter();

    if (this.shouldTriggerAd(episodeNumber)) {
      const event: AdTriggerEvent = {
        dramaId,
        episodeNumber,
        totalWatchedSinceLastAd: this.watchedSinceLastAd,
      };

      // Trigger Monetag In-App Interstitial
      this.triggerMonetagInApp();

      // Notify registered app listeners
      this.notifyListeners(event);
    }

    return this.watchedSinceLastAd;
  }

  public shouldTriggerAd(episodeNumber: number): boolean {
    if (!this.config.enabled || this.config.adEpisodeInterval <= 0) {
      return false;
    }
    // Triggers when watch counter reaches the interval (e.g. after episode 2, 4, 6...)
    return this.watchedSinceLastAd >= this.config.adEpisodeInterval;
  }

  /**
   * Modular Ad Request Handler for custom interstitial transition overlays
   */
  public async requestInterstitialAd(event: AdTriggerEvent): Promise<AdResult> {
    if (!this.config.enabled) {
      return { shown: false, skipped: true };
    }

    console.info(`[AdService] Interstitial Ad Triggered for Drama: ${event.dramaId}, Episode: ${event.episodeNumber}`);

    // Reset the internal counter upon ad trigger
    this.resetCounter();

    // Trigger Monetag In-App Interstitial
    this.triggerMonetagInApp();

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          shown: true,
          skipped: false,
          durationMs: 0,
        });
      }, 300);
    });
  }

  /**
   * Check if a specific episode is unlocked for playback.
   * By default, every episode in the app is locked until unlocked by the user via ads or coins.
   */
  public isEpisodeUnlocked(dramaId: string, episodeNumber: number, _freeToWatch?: boolean): boolean {
    const unlocked = this.getUnlockedEpisodes();
    const dramaUnlocked = unlocked[dramaId];
    if (Array.isArray(dramaUnlocked) && dramaUnlocked.includes(episodeNumber)) {
      return true;
    }
    return false;
  }

  /**
   * Unlock an episode permanently and notify listeners
   */
  public unlockEpisode(dramaId: string, episodeNumber: number): void {
    try {
      const unlocked = this.getUnlockedEpisodes();
      if (!unlocked[dramaId]) {
        unlocked[dramaId] = [];
      }
      if (!unlocked[dramaId].includes(episodeNumber)) {
        unlocked[dramaId].push(episodeNumber);
        localStorage.setItem(STORAGE_KEY_UNLOCKED_EPISODES, JSON.stringify(unlocked));
        this.notifyUnlockListeners(dramaId, episodeNumber);
      }
    } catch (e) {
      console.warn('[AdService] Failed to persist unlocked episode:', e);
    }
  }

  /**
   * Get all unlocked episodes mapped by drama ID
   */
  public getUnlockedEpisodes(): Record<string, number[]> {
    try {
      const val = localStorage.getItem(STORAGE_KEY_UNLOCKED_EPISODES);
      return val ? JSON.parse(val) : {};
    } catch {
      return {};
    }
  }

  /**
   * Trigger Rewarded Interstitial ad and unlock episode on completion
   */
  public async unlockEpisodeWithRewardedAd(
    dramaId: string,
    episodeNumber: number
  ): Promise<{ success: boolean; error?: any }> {
    const res = await this.showRewardedInterstitial();
    if (res.success) {
      this.unlockEpisode(dramaId, episodeNumber);
    }
    return res;
  }

  /**
   * Get current user coin balance
   */
  public getUserCoins(): number {
    try {
      const val = localStorage.getItem(STORAGE_KEY_USER_COINS);
      return val !== null ? parseInt(val, 10) || 0 : DEFAULT_INITIAL_COINS;
    } catch {
      return DEFAULT_INITIAL_COINS;
    }
  }

  /**
   * Add coins to user balance and notify listeners
   */
  public addCoins(amount: number): number {
    const current = this.getUserCoins();
    const updated = Math.max(0, current + amount);
    try {
      localStorage.setItem(STORAGE_KEY_USER_COINS, updated.toString());
      this.notifyCoinListeners(updated);
    } catch (e) {
      console.warn('[AdService] Failed to update coins:', e);
    }
    return updated;
  }

  /**
   * Deduct coins from user balance if sufficient
   */
  public deductCoins(amount: number): boolean {
    const current = this.getUserCoins();
    if (current < amount) {
      return false;
    }
    this.addCoins(-amount);
    return true;
  }

  /**
   * Unlock an episode by spending coins (default 20 coins)
   */
  public unlockEpisodeWithCoins(
    dramaId: string,
    episodeNumber: number,
    cost: number = COIN_UNLOCK_COST
  ): { success: boolean; remainingCoins: number; error?: string } {
    const current = this.getUserCoins();
    if (current < cost) {
      return {
        success: false,
        remainingCoins: current,
        error: 'Not enough coins! You need 20 coins. Claim Daily Reward to get +50 coins.',
      };
    }

    const deducted = this.deductCoins(cost);
    if (!deducted) {
      return {
        success: false,
        remainingCoins: current,
        error: 'Not enough coins! You need 20 coins. Claim Daily Reward to get +50 coins.',
      };
    }

    this.unlockEpisode(dramaId, episodeNumber);
    return {
      success: true,
      remainingCoins: this.getUserCoins(),
    };
  }

  /**
   * Starts a daily reward ad session, invoking Monetag SDK and recording start time.
   */
  public startDailyRewardSession(bonusAmount: number = 50): {
    startTime: number;
    minDurationSeconds: number;
    bonusAmount: number;
  } {
    const session = {
      startTime: Date.now(),
      minDurationSeconds: DAILY_REWARD_MIN_WATCH_SECONDS,
      bonusAmount,
    };

    // Trigger Monetag Pop Ad
    if (typeof window !== 'undefined' && typeof (window as any).show_11683116 === 'function') {
      try {
        (window as any).show_11683116('pop');
      } catch (err) {
        console.warn('[AdService] Monetag show_11683116 error:', err);
      }
    }

    return session;
  }

  /**
   * Verifies the completion of an ad session.
   * If watched duration is < 25 seconds, rejects without granting any coins.
   */
  public verifyAndClaimDailyBonus(
    startTime: number,
    bonusAmount: number = 50,
    minDurationSeconds: number = DAILY_REWARD_MIN_WATCH_SECONDS
  ): {
    success: boolean;
    coinsAwarded: number;
    newTotal: number;
    elapsedSeconds: number;
    error?: string;
  } {
    const elapsedMs = Date.now() - startTime;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);

    if (elapsedSeconds < minDurationSeconds) {
      return {
        success: false,
        coinsAwarded: 0,
        newTotal: this.getUserCoins(),
        elapsedSeconds,
        error: 'Reward failed! You must watch the ad for at least 25 seconds to claim your 50 coins.',
      };
    }

    const newTotal = this.addCoins(bonusAmount);
    return {
      success: true,
      coinsAwarded: bonusAmount,
      newTotal,
      elapsedSeconds,
    };
  }

  /**
   * Trigger Rewarded Popup ad and grant daily bonus coins ONLY upon verified 25-second completion.
   */
  public async claimDailyBonusWithPopup(
    bonusAmount: number = 50,
    minWatchSeconds: number = DAILY_REWARD_MIN_WATCH_SECONDS
  ): Promise<{ success: boolean; coinsAwarded: number; newTotal: number; elapsedSeconds: number; error?: any }> {
    const res = await this.showRewardedPopup(minWatchSeconds);
    if (res.success && res.elapsedSeconds >= minWatchSeconds) {
      const newTotal = this.addCoins(bonusAmount);
      return { success: true, coinsAwarded: bonusAmount, newTotal, elapsedSeconds: res.elapsedSeconds };
    }
    return {
      success: false,
      coinsAwarded: 0,
      newTotal: this.getUserCoins(),
      elapsedSeconds: res.elapsedSeconds || 0,
      error: res.error || 'Reward failed! You must watch the ad for at least 25 seconds to claim your 50 coins.',
    };
  }

  public onUnlockListener(listener: (dramaId: string, episodeNumber: number) => void): () => void {
    this.unlockListeners.add(listener);
    return () => {
      this.unlockListeners.delete(listener);
    };
  }

  public onCoinsListener(listener: (coins: number) => void): () => void {
    this.coinListeners.add(listener);
    return () => {
      this.coinListeners.delete(listener);
    };
  }

  private notifyUnlockListeners(dramaId: string, episodeNumber: number) {
    this.unlockListeners.forEach((listener) => {
      try {
        listener(dramaId, episodeNumber);
      } catch (e) {
        console.error('[AdService] Unlock listener error:', e);
      }
    });
  }

  private notifyCoinListeners(coins: number) {
    this.coinListeners.forEach((listener) => {
      try {
        listener(coins);
      } catch (e) {
        console.error('[AdService] Coin listener error:', e);
      }
    });
  }

  public onAdTriggerListener(listener: (event: AdTriggerEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(event: AdTriggerEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error('[AdService] Listener error:', e);
      }
    });
  }
}

export const adService = new AdService();

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
  showRewardedPopup(): Promise<{ success: boolean; error?: any }>;
  requestInterstitialAd(event: AdTriggerEvent): Promise<AdResult>;
  onAdTriggerListener(listener: (event: AdTriggerEvent) => void): () => void;
}

export const AD_EPISODE_INTERVAL = 2; // Shows an ad every 2 episodes

const DEFAULT_CONFIG: AdConfig = {
  adEpisodeInterval: AD_EPISODE_INTERVAL,
  enabled: true,
};

const STORAGE_KEY_WATCH_COUNT = 'dramapulse_ad_watch_counter';
const STORAGE_KEY_AD_CONFIG = 'dramapulse_ad_config';

class AdService implements IAdService {
  private config: AdConfig;
  private watchedSinceLastAd: number = 0;
  private listeners: Set<(event: AdTriggerEvent) => void> = new Set();
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
   */
  public async showRewardedPopup(): Promise<{ success: boolean; error?: any }> {
    if (typeof window !== 'undefined' && typeof (window as any).show_11683116 === 'function') {
      return new Promise((resolve) => {
        try {
          const promise = (window as any).show_11683116('pop');
          if (promise && typeof promise.then === 'function') {
            promise
              .then(() => resolve({ success: true }))
              .catch((e: any) => {
                console.error('[AdService] Monetag Rewarded Popup error:', e);
                resolve({ success: false, error: e });
              });
          } else {
            resolve({ success: true });
          }
        } catch (e: any) {
          console.error('[AdService] Monetag Rewarded Popup exception:', e);
          resolve({ success: false, error: e });
        }
      });
    }
    return { success: true };
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

import { AdConfig, AdTriggerEvent } from '../types';

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
  /**
   * Primary entry point for playing an interstitial/rewarded ad before next episode.
   * In Phase 1: Resolves cleanly via placeholder/adapter interface.
   * In Phase 2: Connects to Monetag SDK (e.g., showMonetagInterstitial or Monetag MiniApp Tag).
   */
  requestInterstitialAd(event: AdTriggerEvent): Promise<AdResult>;
  onAdTriggerListener(listener: (event: AdTriggerEvent) => void): () => void;
}

const DEFAULT_CONFIG: AdConfig = {
  adEpisodeInterval: 3, // Shows an ad every 3 episodes
  enabled: true,
};

const STORAGE_KEY_WATCH_COUNT = 'dramapulse_ad_watch_counter';
const STORAGE_KEY_AD_CONFIG = 'dramapulse_ad_config';

class AdService implements IAdService {
  private config: AdConfig;
  private watchedSinceLastAd: number = 0;
  private listeners: Set<(event: AdTriggerEvent) => void> = new Set();

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

  public incrementWatchCounter(dramaId: string, episodeNumber: number): number {
    this.watchedSinceLastAd += 1;
    this.persistCounter();

    if (this.shouldTriggerAd(episodeNumber)) {
      const event: AdTriggerEvent = {
        dramaId,
        episodeNumber,
        totalWatchedSinceLastAd: this.watchedSinceLastAd,
      };
      this.notifyListeners(event);
    }

    return this.watchedSinceLastAd;
  }

  public shouldTriggerAd(episodeNumber: number): boolean {
    if (!this.config.enabled || this.config.adEpisodeInterval <= 0) {
      return false;
    }
    // Triggers when watch counter reaches the interval (e.g. after episode 3, 6, 9...)
    return this.watchedSinceLastAd >= this.config.adEpisodeInterval;
  }

  /**
   * Modular Ad Request Handler
   * Designed for direct Monetag WebApp Tag / SDK insertion in Phase 2
   */
  public async requestInterstitialAd(event: AdTriggerEvent): Promise<AdResult> {
    if (!this.config.enabled) {
      return { shown: false, skipped: true };
    }

    console.info(`[AdService] Interstitial Ad Triggered for Drama: ${event.dramaId}, Episode: ${event.episodeNumber}`);

    // Reset the internal counter upon ad trigger
    this.resetCounter();

    // In Phase 2:
    // await window.Monetag?.showInterstitial({ ... });
    // For Phase 1, we simulate an asynchronous non-blocking resolution:
    return new Promise((resolve) => {
      // Clean short pause simulating ad verification / callback lifecycle
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

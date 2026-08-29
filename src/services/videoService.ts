import { Episode, VideoQuality } from '../types';

export interface IVideoService {
  resolveStreamUrl(episode: Episode, targetQuality?: string): string;
  isHlsSupported(): boolean;
  getPreloadUrl(nextEpisode?: Episode): string | null;
  getCloudflareR2BaseUrl(): string;
  setCloudflareR2BaseUrl(url: string): void;
}

const STORAGE_KEY_R2_URL = 'dramapulse_r2_base_url';

class VideoService implements IVideoService {
  private r2BaseUrl: string;

  constructor() {
    this.r2BaseUrl = this.loadR2Url();
  }

  private loadR2Url(): string {
    try {
      return localStorage.getItem(STORAGE_KEY_R2_URL) || '';
    } catch {
      return '';
    }
  }

  public getCloudflareR2BaseUrl(): string {
    return this.r2BaseUrl;
  }

  public setCloudflareR2BaseUrl(url: string): void {
    this.r2BaseUrl = url;
    try {
      localStorage.setItem(STORAGE_KEY_R2_URL, url);
    } catch {
      // ignore
    }
  }

  /**
   * Resolves the final video URL.
   * If an R2 CDN base URL is configured in Phase 2, it prefixes it;
   * otherwise uses the direct episode stream URL.
   */
  public resolveStreamUrl(episode: Episode, targetQuality?: string): string {
    if (!episode) return '';

    // If specific quality is requested and available
    if (targetQuality && episode.availableQualities && episode.availableQualities.length > 0) {
      const match = episode.availableQualities.find(
        (q) => q.label.toLowerCase() === targetQuality.toLowerCase()
      );
      if (match) {
        return this.formatUrl(match.url);
      }
    }

    return this.formatUrl(episode.videoSource);
  }

  private formatUrl(url: string): string {
    if (!url) return '';
    // If it's a relative path and R2 base URL is set
    if (this.r2BaseUrl && !url.startsWith('http://') && !url.startsWith('https://')) {
      const cleanBase = this.r2BaseUrl.endsWith('/') ? this.r2BaseUrl.slice(0, -1) : this.r2BaseUrl;
      const cleanPath = url.startsWith('/') ? url : `/${url}`;
      return `${cleanBase}${cleanPath}`;
    }
    return url;
  }

  public isHlsSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const video = document.createElement('video');
    return Boolean(
      video.canPlayType('application/vnd.apple.mpegurl') ||
      video.canPlayType('application/x-mpegURL')
    );
  }

  public getPreloadUrl(nextEpisode?: Episode): string | null {
    if (!nextEpisode) return null;
    return this.resolveStreamUrl(nextEpisode);
  }
}

export const videoService = new VideoService();

import { TelegramUser, TelegramTheme } from '../types';

/**
 * Telegram Mini App WebApp window extension interface
 */
interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      is_premium?: boolean;
      photo_url?: string;
    };
    query_id?: string;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  openLink: (url: string) => void;
  openTelegramLink: (url: string) => void;
  shareToStory?: (mediaUrl: string, params?: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export interface ITelegramService {
  isAvailable(): boolean;
  getUser(): TelegramUser | null;
  getTheme(): TelegramTheme | null;
  expand(): void;
  triggerHaptic(type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'): void;
  setBackButton(visible: boolean, onClick?: () => void): void;
  close(): void;
  ready(): void;
}

class TelegramService implements ITelegramService {
  private backButtonCallback: (() => void) | null = null;

  private get webApp(): TelegramWebApp | undefined {
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      return window.Telegram.WebApp;
    }
    return undefined;
  }

  public isAvailable(): boolean {
    return !!this.webApp && !!this.webApp.initData;
  }

  public ready(): void {
    if (this.webApp) {
      try {
        this.webApp.ready();
        this.webApp.expand();
      } catch (e) {
        console.warn('[TelegramService] ready/expand failed:', e);
      }
    }
  }

  public getUser(): TelegramUser | null {
    const unsafeUser = this.webApp?.initDataUnsafe?.user;
    if (unsafeUser) {
      return {
        id: unsafeUser.id,
        firstName: unsafeUser.first_name,
        lastName: unsafeUser.last_name,
        username: unsafeUser.username,
        languageCode: unsafeUser.language_code,
        isPremium: unsafeUser.is_premium,
        photoUrl: unsafeUser.photo_url,
      };
    }
    return null;
  }

  public getTheme(): TelegramTheme | null {
    const params = this.webApp?.themeParams;
    if (!params) return null;

    return {
      bgColor: params.bg_color || '#0b0c10',
      textColor: params.text_color || '#f0f2f5',
      hintColor: params.hint_color || '#8e939d',
      linkColor: params.link_color || '#3b82f6',
      buttonColor: params.button_color || '#e50914',
      buttonTextColor: params.button_text_color || '#ffffff',
      secondaryBgColor: params.secondary_bg_color || '#161820',
    };
  }

  public expand(): void {
    if (this.webApp) {
      try {
        this.webApp.expand();
      } catch (e) {
        console.warn('[TelegramService] expand failed:', e);
      }
    }
  }

  public triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection' = 'light'): void {
    if (this.webApp?.HapticFeedback) {
      try {
        if (type === 'success' || type === 'warning' || type === 'error') {
          this.webApp.HapticFeedback.notificationOccurred(type);
        } else if (type === 'selection') {
          this.webApp.HapticFeedback.selectionChanged();
        } else {
          this.webApp.HapticFeedback.impactOccurred(type);
        }
      } catch (e) {
        // Suppress haptic errors in web fallback
      }
    }
  }

  public setBackButton(visible: boolean, onClick?: () => void): void {
    if (!this.webApp?.BackButton) return;

    if (this.backButtonCallback) {
      this.webApp.BackButton.offClick(this.backButtonCallback);
      this.backButtonCallback = null;
    }

    if (visible) {
      this.webApp.BackButton.show();
      if (onClick) {
        this.backButtonCallback = onClick;
        this.webApp.BackButton.onClick(onClick);
      }
    } else {
      this.webApp.BackButton.hide();
    }
  }

  public close(): void {
    if (this.webApp) {
      this.webApp.close();
    }
  }
}

export const telegramService = new TelegramService();

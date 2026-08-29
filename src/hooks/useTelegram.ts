import { useState, useEffect, useCallback } from 'react';
import { TelegramUser, TelegramTheme } from '../types';
import { telegramService } from '../services/telegramService';

export function useTelegram() {
  const [isTelegram, setIsTelegram] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [theme, setTheme] = useState<TelegramTheme | null>(null);

  useEffect(() => {
    telegramService.ready();
    telegramService.expand();

    const isTg = telegramService.isAvailable();
    setIsTelegram(isTg);

    const tgUser = telegramService.getUser();
    if (tgUser) {
      setUser(tgUser);
    } else {
      // In web fallback / browser dev mode, use a realistic Telegram guest user representation
      setUser({
        id: 74928104,
        firstName: 'Alex',
        lastName: 'Rivers',
        username: 'alex_rivers',
        languageCode: 'en',
        isPremium: true,
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      });
    }

    const tgTheme = telegramService.getTheme();
    if (tgTheme) {
      setTheme(tgTheme);
    }
  }, []);

  const triggerHaptic = useCallback(
    (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection' = 'light') => {
      telegramService.triggerHaptic(type);
    },
    []
  );

  const registerBackButton = useCallback((visible: boolean, onClick?: () => void) => {
    telegramService.setBackButton(visible, onClick);
  }, []);

  return {
    isTelegram,
    user,
    theme,
    triggerHaptic,
    registerBackButton,
  };
}

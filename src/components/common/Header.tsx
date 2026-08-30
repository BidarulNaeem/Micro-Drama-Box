import React, { useState, useEffect } from 'react';
import { Search, Bell, Sparkles, Flame, Coins } from 'lucide-react';
import { TelegramUser } from '../../types';
import { adService } from '../../services/adService';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  user: TelegramUser | null;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenNotifications,
  onOpenProfile,
  user,
  unreadCount = 2,
}) => {
  const [coins, setCoins] = useState<number>(() => adService.getUserCoins());

  useEffect(() => {
    const unsub = adService.onCoinsListener((newCoins) => {
      setCoins(newCoins);
    });
    return () => unsub();
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-[#08090c]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 pt-safe pb-3">
      <div className="w-full max-w-lg mx-auto flex items-center justify-between">
        {/* Original Brand Logo: VELA */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-600/30">
            <Flame className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-lg text-white tracking-tight font-display">
                VELA
              </span>
              <span className="text-[10px] font-bold tracking-widest text-rose-400 uppercase bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                DRAMA
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Coins, Notifications, Search & User Avatar */}
        <div className="flex items-center space-x-2">
          {/* Coin Balance Quick Button */}
          <button
            id="header-coins-btn"
            onClick={onOpenProfile}
            className="px-2.5 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 border border-amber-500/30 flex items-center space-x-1.5 text-amber-300 transition-all cursor-pointer"
            aria-label="Coins Balance"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-black font-display">{coins}</span>
          </button>

          {/* Notification Button */}
          <button
            id="header-notification-btn"
            onClick={onOpenNotifications}
            className="relative w-9 h-9 rounded-full bg-white/[0.07] hover:bg-white/[0.12] active:scale-95 border border-white/[0.08] flex items-center justify-center text-white/80 transition-all cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-white/90" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#08090c]" />
            )}
          </button>

          {/* Search Button */}
          <button
            id="header-search-btn"
            onClick={onOpenSearch}
            className="w-9 h-9 rounded-full bg-white/[0.07] hover:bg-white/[0.12] active:scale-95 border border-white/[0.08] flex items-center justify-center text-white/80 transition-all cursor-pointer"
            aria-label="Search Dramas"
          >
            <Search className="w-4 h-4 text-white/90" />
          </button>

          {/* User Profile Avatar */}
          <button
            id="header-profile-btn"
            onClick={onOpenProfile}
            className="w-9 h-9 rounded-full overflow-hidden border border-white/20 active:scale-95 transition-all relative group cursor-pointer"
            aria-label="User Profile"
          >
            {user?.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.firstName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.firstName?.charAt(0) || 'U'}
              </div>
            )}
            {user?.isPremium && (
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-2 h-2 text-black fill-black" />
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

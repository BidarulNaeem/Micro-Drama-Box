import React from 'react';
import { Compass, Flame, Bookmark, User } from 'lucide-react';
import { MainTab } from '../../types';

interface BottomNavProps {
  currentTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  onHaptic: (type?: 'light' | 'medium' | 'heavy' | 'selection') => void;
  savedCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onHaptic,
  savedCount,
}) => {
  const tabs: { id: MainTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'foryou', label: 'For You', icon: Flame },
    { id: 'myshows', label: 'My Shows', icon: Bookmark },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-[#0c0d12]/95 backdrop-blur-xl border-t border-white/[0.08] pb-safe pt-2">
      <div className="w-full max-w-lg mx-auto px-4 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`tab-nav-${tab.id}`}
              onClick={() => {
                onSelectTab(tab.id);
                onHaptic('selection');
              }}
              className="relative flex flex-col items-center justify-center py-1 px-3 min-w-[64px] group active:scale-95 transition-all"
            >
              {/* Active Glow Pill */}
              {isActive && (
                <div className="absolute -top-2 w-8 h-1 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${
                    isActive
                      ? 'text-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                      : 'text-white/50 group-hover:text-white/80'
                  }`}
                />
                {tab.id === 'myshows' && savedCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow">
                    {savedCount > 9 ? '9+' : savedCount}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] mt-1 font-medium tracking-tight transition-colors duration-200 ${
                  isActive ? 'text-rose-400 font-bold' : 'text-white/40 group-hover:text-white/70'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

import React, { useState, useEffect } from 'react';
import { Bookmark, Clock, Trash2, Play, Star, Film } from 'lucide-react';
import { Drama, UserProgress, MyShowItem } from '../../types';
import { dramaRepository } from '../../repositories/dramaRepository';
import { userProgressRepository } from '../../repositories/userProgressRepository';
import { DramaCover } from '../common/DramaCover';

interface MyShowsViewProps {
  onStartWatch: (drama: Drama, episodeNumber?: number) => void;
  onOpenDetails: (drama: Drama) => void;
  onHaptic: (type?: 'light' | 'medium' | 'heavy' | 'selection' | 'success') => void;
}

export const MyShowsView: React.FC<MyShowsViewProps> = ({
  onStartWatch,
  onOpenDetails,
  onHaptic,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'saved' | 'history'>('saved');
  const [savedShows, setSavedShows] = useState<Drama[]>([]);
  const [historyItems, setHistoryItems] = useState<{ progress: UserProgress; drama: Drama }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const [myShows, progressList, allDramas] = await Promise.all([
      userProgressRepository.getMyShows(),
      userProgressRepository.getAllHistory(),
      dramaRepository.getAllDramas(),
    ]);

    const saved = allDramas.filter((d) => myShows.some((s) => s.dramaId === d.id));
    setSavedShows(saved);

    const history = progressList
      .map((p) => {
        const drama = allDramas.find((d) => d.id === p.dramaId);
        return drama ? { progress: p, drama } : null;
      })
      .filter(Boolean) as { progress: UserProgress; drama: Drama }[];

    setHistoryItems(history);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRemoveSaved = async (dramaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await userProgressRepository.toggleMyShow(dramaId);
    setSavedShows((prev) => prev.filter((d) => d.id !== dramaId));
    onHaptic('light');
  };

  const handleClearHistory = async () => {
    await userProgressRepository.clearHistory();
    setHistoryItems([]);
    onHaptic('success');
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Subtab Toggle Buttons */}
      <div className="flex bg-white/[0.06] p-1 rounded-2xl border border-white/[0.08]">
        <button
          id="myshows-tab-saved"
          onClick={() => {
            setActiveSubTab('saved');
            onHaptic('selection');
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
            activeSubTab === 'saved'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Saved Dramas ({savedShows.length})</span>
        </button>

        <button
          id="myshows-tab-history"
          onClick={() => {
            setActiveSubTab('history');
            onHaptic('selection');
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
            activeSubTab === 'history'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Watch History ({historyItems.length})</span>
        </button>
      </div>

      {/* Content Rendering */}
      {activeSubTab === 'saved' ? (
        savedShows.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {savedShows.map((drama) => (
              <div
                key={drama.id}
                id={`saved-item-${drama.id}`}
                onClick={() => onOpenDetails(drama)}
                className="bg-[#12141c] rounded-2xl overflow-hidden border border-white/5 cursor-pointer group hover:border-rose-500/40 transition-all relative"
              >
                <div className="relative aspect-[2/3] w-full bg-black/40 overflow-hidden">
                  <DramaCover
                    src={drama.coverImage || drama.poster}
                    alt={drama.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <button
                    id={`remove-saved-${drama.id}`}
                    onClick={(e) => handleRemoveSaved(drama.id, e)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-rose-400 active:scale-90 transition-all border border-white/10"
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </button>

                  <div className="absolute bottom-2 left-2 flex items-center space-x-1 text-[10px] text-amber-300 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded font-bold">
                    <Star className="w-3 h-3 fill-amber-300" />
                    <span>{drama.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="p-2.5 space-y-1">
                  <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-rose-400">
                    {drama.title}
                  </h4>
                  <p className="text-[10px] text-white/50 truncate">
                    {drama.totalEpisodes} Episodes • {drama.genres[0]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center space-y-3 text-white/50">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
              <Bookmark className="w-6 h-6 text-white/30" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">No saved dramas yet</p>
              <p className="text-xs text-white/40 max-w-xs">
                Tap the "+ My Shows" button on any drama to add it to your watchlist.
              </p>
            </div>
          </div>
        )
      ) : historyItems.length > 0 ? (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              id="clear-watch-history-btn"
              onClick={handleClearHistory}
              className="text-xs text-white/40 hover:text-rose-400 flex items-center space-x-1 py-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {historyItems.map(({ progress, drama }) => {
              const percent =
                progress.durationSeconds > 0
                  ? Math.min(100, Math.round((progress.progressSeconds / progress.durationSeconds) * 100))
                  : 0;

              return (
                <div
                  key={drama.id}
                  id={`history-item-${drama.id}`}
                  onClick={() => onStartWatch(drama, progress.episodeNumber)}
                  className="p-3 rounded-2xl bg-[#12141c] border border-white/5 hover:border-rose-500/30 flex items-center space-x-3 cursor-pointer group transition-all"
                >
                  <div className="relative w-20 aspect-[16/10] rounded-xl overflow-hidden bg-black shrink-0">
                    <DramaCover
                      src={drama.coverImage || drama.poster || drama.backdrop}
                      alt={drama.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Play className="w-4 h-4 fill-white text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-rose-400">
                      {drama.title}
                    </h4>
                    <p className="text-[11px] text-rose-400 font-semibold">
                      Episode {progress.episodeNumber} of {drama.totalEpisodes}
                    </p>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center text-center space-y-3 text-white/50">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
            <Clock className="w-6 h-6 text-white/30" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">No watch history</p>
            <p className="text-xs text-white/40 max-w-xs">
              Episodes you start streaming will automatically appear here for instant resuming.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

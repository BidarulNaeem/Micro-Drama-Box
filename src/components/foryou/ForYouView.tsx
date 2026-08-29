import React, { useState, useEffect } from 'react';
import { Play, Flame, Star, Sparkles, Eye, Bookmark, BookmarkCheck } from 'lucide-react';
import { Drama } from '../../types';
import { dramaRepository } from '../../repositories/dramaRepository';
import { userProgressRepository } from '../../repositories/userProgressRepository';
import { DramaCover } from '../common/DramaCover';

interface ForYouViewProps {
  onStartWatch: (drama: Drama, episodeNumber?: number) => void;
  onOpenDetails: (drama: Drama) => void;
  onHaptic: (type?: 'light' | 'medium' | 'heavy' | 'selection' | 'success') => void;
}

export const ForYouView: React.FC<ForYouViewProps> = ({
  onStartWatch,
  onOpenDetails,
  onHaptic,
}) => {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedDramaIds, setSavedDramaIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;
    dramaRepository.getAllDramas().then((initialDramas) => {
      if (isMounted && initialDramas && initialDramas.length > 0) {
        setDramas(initialDramas);
        setIsLoading(false);
      }
    });

    const unsubscribe = dramaRepository.subscribeAll((liveDramas) => {
      if (isMounted) {
        setDramas(liveDramas);
        setIsLoading(false);
      }
    });

    userProgressRepository.getMyShows().then((shows) => {
      if (isMounted) {
        setSavedDramaIds(new Set(shows.map((s) => s.dramaId)));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);


  const handleToggleSave = async (dramaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const added = await userProgressRepository.toggleMyShow(dramaId);
    setSavedDramaIds((prev) => {
      const next = new Set(prev);
      if (added) next.add(dramaId);
      else next.delete(dramaId);
      return next;
    });
    onHaptic(added ? 'success' : 'light');
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header Info */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Flame className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white font-display">For You</h2>
            <p className="text-xs text-white/50">Personalized short-drama binge picks</p>
          </div>
        </div>
      </div>

      {/* Feed Cards */}
      <div className="space-y-4">
        {isLoading && dramas.length === 0 && (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="relative rounded-3xl overflow-hidden bg-[#11131a] border border-white/[0.08] animate-pulse"
              >
                <div className="aspect-[16/10] w-full bg-gradient-to-tr from-[#12141c] via-[#1a1d28] to-[#12141c]" />
                <div className="p-4 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <div className="w-1/2 h-5 rounded bg-white/10" />
                    <div className="w-16 h-4 rounded bg-white/5" />
                  </div>
                  <div className="w-full h-3.5 rounded bg-white/5" />
                  <div className="w-3/4 h-3.5 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </>
        )}

        {dramas.map((drama) => {

          const isSaved = savedDramaIds.has(drama.id);

          return (
            <div
              key={drama.id}
              id={`foryou-card-${drama.id}`}
              onClick={() => onOpenDetails(drama)}
              className="relative rounded-3xl overflow-hidden bg-[#11131a] border border-white/[0.08] group cursor-pointer shadow-xl hover:border-rose-500/40 transition-all"
            >
              {/* Cover Backdrop */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
                <DramaCover
                  src={drama.coverImage || drama.poster || drama.backdrop}
                  alt={drama.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#11131a] via-[#11131a]/40 to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-extrabold text-amber-300 border border-white/10 flex items-center space-x-1">
                    <Star className="w-3 h-3 fill-amber-300" />
                    <span>{drama.rating.toFixed(1)}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-600/80 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                    {drama.status}
                  </span>
                </div>

                {/* Bookmark Toggle */}
                <button
                  id={`foryou-bookmark-${drama.id}`}
                  onClick={(e) => handleToggleSave(drama.id, e)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white active:scale-90 transition-all"
                >
                  {isSaved ? (
                    <BookmarkCheck className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ) : (
                    <Bookmark className="w-4 h-4 text-white" />
                  )}
                </button>

                {/* Quick Play Trigger */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    id={`foryou-play-btn-${drama.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartWatch(drama, 1);
                    }}
                    className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/50 group-hover:scale-110 active:scale-95 transition-all"
                  >
                    <Play className="w-5 h-5 fill-white translate-x-0.5" />
                  </button>
                </div>
              </div>

              {/* Drama Details Content */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-white font-display line-clamp-1 group-hover:text-rose-400 transition-colors">
                    {drama.title}
                  </h3>
                  <span className="text-xs font-semibold text-white/50 shrink-0">
                    {drama.totalEpisodes} Episodes
                  </span>
                </div>

                <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                  {drama.description}
                </p>

                <div className="flex items-center justify-between pt-1 text-[11px] text-white/50">
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    {drama.genres.slice(0, 2).map((g) => (
                      <span
                        key={g}
                        className="px-2 py-0.5 rounded bg-white/5 text-white/70 border border-white/10"
                      >
                        {g}
                      </span>
                    ))}
                  </div>

                  <span className="flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>{(drama.viewsCount / 1000000).toFixed(1)}M views</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

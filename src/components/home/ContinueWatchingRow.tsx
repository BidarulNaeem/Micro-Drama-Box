import React from 'react';
import { Play, Clock } from 'lucide-react';
import { Drama, UserProgress } from '../../types';
import { DramaCover } from '../common/DramaCover';

interface ContinueWatchingRowProps {
  history: UserProgress[];
  dramas: Drama[];
  onResume: (drama: Drama, episodeNumber: number) => void;
}

export const ContinueWatchingRow: React.FC<ContinueWatchingRowProps> = ({
  history,
  dramas,
  onResume,
}) => {
  if (!history || history.length === 0) return null;

  // Match history with drama objects
  const activeItems = history
    .map((h) => {
      const drama = dramas.find((d) => d.id === h.dramaId);
      return drama ? { progress: h, drama } : null;
    })
    .filter(Boolean) as { progress: UserProgress; drama: Drama }[];

  if (activeItems.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center space-x-2 px-1">
        <Clock className="w-4 h-4 text-rose-500" />
        <h3 className="text-base sm:text-lg font-black text-white font-display tracking-tight">
          Continue Watching
        </h3>
      </div>

      <div className="flex space-x-3.5 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
        {activeItems.map(({ progress, drama }) => {
          const percent =
            progress.durationSeconds > 0
              ? Math.min(100, Math.round((progress.progressSeconds / progress.durationSeconds) * 100))
              : 0;

          return (
            <div
              key={drama.id}
              onClick={() => onResume(drama, progress.episodeNumber)}
              className="relative shrink-0 w-44 sm:w-48 bg-[#14161f] rounded-2xl overflow-hidden border border-white/[0.08] cursor-pointer group hover:border-rose-500/40 transition-all"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-[16/10] w-full bg-black/40 overflow-hidden">
                <DramaCover
                  src={drama.coverImage || drama.poster || drama.backdrop}
                  alt={drama.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-white translate-x-0.5" />
                  </div>
                </div>

                {/* Episode Badge */}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                    Ep. {progress.episodeNumber}
                  </span>
                </div>

                {/* Progress bar at bottom of thumbnail */}
                <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
                  <div
                    className="h-full bg-rose-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Title & Info */}
              <div className="p-2.5 space-y-0.5">
                <h4 className="text-xs font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                  {drama.title}
                </h4>
                <p className="text-[10px] text-white/50">
                  {progress.completed ? 'Finished' : `${percent}% completed`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

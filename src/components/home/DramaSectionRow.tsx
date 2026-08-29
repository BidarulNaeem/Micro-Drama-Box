import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Drama } from '../../types';
import { DramaCard, DramaCardSkeleton } from './DramaCard';

interface DramaSectionRowProps {
  title: string;
  subtitle?: string;
  dramas: Drama[];
  showRanking?: boolean;
  onSelectDrama: (drama: Drama) => void;
  onSeeAll?: () => void;
}

export const DramaSectionRowSkeleton: React.FC<{ title: string }> = ({ title }) => {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between px-1">
        <div>
          <h3 className="text-base sm:text-lg font-black text-white font-display tracking-tight">
            {title}
          </h3>
        </div>
      </div>
      <div className="flex space-x-3.5 overflow-x-hidden pb-2 -mx-4 px-4">
        {[1, 2, 3, 4].map((i) => (
          <DramaCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
};

export const DramaSectionRow: React.FC<DramaSectionRowProps> = ({

  title,
  subtitle,
  dramas,
  showRanking = false,
  onSelectDrama,
  onSeeAll,
}) => {
  if (!dramas || dramas.length === 0) return null;

  return (
    <section className="space-y-3">
      {/* Section Header */}
      <div className="flex items-end justify-between px-1">
        <div>
          <h3 className="text-base sm:text-lg font-black text-white font-display tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-white/50 -mt-0.5">{subtitle}</p>
          )}
        </div>

        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="flex items-center text-xs font-semibold text-rose-500 hover:text-rose-400 active:scale-95 transition-all"
          >
            <span>See All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal Scrolling Track */}
      <div className="flex space-x-3.5 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar scroll-smooth">
        {dramas.map((drama, index) => (
          <DramaCard
            key={drama.id}
            drama={drama}
            rank={showRanking ? index + 1 : undefined}
            onSelect={onSelectDrama}
          />
        ))}
      </div>
    </section>
  );
};

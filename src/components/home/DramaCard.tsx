import React from 'react';
import { Star, Play, CheckCircle } from 'lucide-react';
import { Drama } from '../../types';
import { DramaCover } from '../common/DramaCover';

interface DramaCardProps {
  drama: Drama;
  rank?: number;
  onSelect: (drama: Drama) => void;
  onPlayDirectly?: (drama: Drama) => void;
}

export const DramaCardSkeleton: React.FC = () => {
  return (
    <div className="relative shrink-0 w-32 sm:w-36 animate-pulse select-none">
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#161820] border border-white/[0.05]">
        <div className="w-full h-full bg-gradient-to-tr from-[#12141c] via-[#1c202d] to-[#12141c]" />
      </div>
      <div className="mt-2 space-y-1.5">
        <div className="w-4/5 h-3.5 rounded bg-white/10" />
        <div className="w-1/2 h-3 rounded bg-white/5" />
      </div>
    </div>
  );
};

export const DramaCard: React.FC<DramaCardProps> = ({

  drama,
  rank,
  onSelect,
  onPlayDirectly,
}) => {
  return (
    <div
      id={`drama-card-${drama.id}`}
      onClick={() => onSelect(drama)}
      className="relative shrink-0 w-32 sm:w-36 group cursor-pointer select-none"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#161820] border border-white/[0.08] shadow-md group-hover:border-rose-500/40 transition-all duration-300">
        <DramaCover
          src={drama.coverImage || drama.poster || drama.backdrop}
          alt={drama.title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Gradient shadow on bottom of poster */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Numbered Rank for Trending (e.g. 1, 2, 3) */}
        {rank !== undefined && (
          <div className="absolute -bottom-2 -left-1 z-10">
            <span className="font-display font-black text-4xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-t from-white to-white/60 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] italic">
              {rank}
            </span>
          </div>
        )}

        {/* Episode count / Status badge */}
        <div className="absolute top-2 right-2">
          <span className="px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white/90 border border-white/10">
            {drama.totalEpisodes} eps
          </span>
        </div>

        {/* Quick Play Hover Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[2px]">
          <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/50 transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-4 h-4 fill-white translate-x-0.5" />
          </div>
        </div>
      </div>

      {/* Title & Metadata */}
      <div className="mt-2 space-y-0.5">
        <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-rose-400 transition-colors">
          {drama.title}
        </h4>
        <div className="flex items-center justify-between text-[11px] text-white/50">
          <span className="truncate max-w-[80px]">
            {drama.genres[0] || 'Drama'}
          </span>
          <span className="flex items-center space-x-0.5 text-amber-400 font-semibold shrink-0">
            <Star className="w-3 h-3 fill-amber-400" />
            <span>{drama.rating.toFixed(1)}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

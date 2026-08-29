import React from 'react';
import { Play, Bookmark, BookmarkCheck, Star, Eye } from 'lucide-react';
import { Drama } from '../../types';
import { DramaCover } from '../common/DramaCover';

interface HeroFeaturedProps {
  drama: Drama;
  onWatch: (drama: Drama) => void;
  onDetails: (drama: Drama) => void;
  isSaved: boolean;
  onToggleSave: (drama: Drama) => void;
}

export const HeroFeaturedSkeleton: React.FC = () => {
  return (
    <div className="relative w-full aspect-[4/5] sm:aspect-[16/11] max-h-[460px] rounded-3xl overflow-hidden shadow-2xl border border-white/[0.08] bg-[#11131a] animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-tr from-[#0d0e14] via-[#171a24] to-[#0d0e14]" />
      
      {/* Top badges placeholder */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
        <div className="w-24 h-6 rounded-full bg-white/10" />
        <div className="w-12 h-6 rounded-full bg-white/10" />
      </div>

      {/* Bottom content placeholder */}
      <div className="absolute bottom-0 inset-x-0 p-5 z-10 space-y-3">
        <div className="flex space-x-2">
          <div className="w-16 h-4 rounded bg-white/10" />
          <div className="w-16 h-4 rounded bg-white/10" />
        </div>
        <div className="w-3/4 h-7 rounded bg-white/15" />
        <div className="w-full h-4 rounded bg-white/10" />
        <div className="w-2/3 h-4 rounded bg-white/10" />
        <div className="flex space-x-3 pt-2">
          <div className="flex-1 h-12 rounded-2xl bg-white/15" />
          <div className="w-28 h-12 rounded-2xl bg-white/10" />
        </div>
      </div>
    </div>
  );
};

export const HeroFeatured: React.FC<HeroFeaturedProps> = ({

  drama,
  onWatch,
  onDetails,
  isSaved,
  onToggleSave,
}) => {

  return (
    <div className="relative w-full aspect-[4/5] sm:aspect-[16/11] max-h-[460px] rounded-3xl overflow-hidden shadow-2xl border border-white/[0.08] group">
      {/* Backdrop Image */}
      <DramaCover
        src={drama.coverImage || drama.poster || drama.backdrop}
        alt={drama.title}
        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
      />

      {/* Cinematic Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#08090c] via-[#08090c]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#08090c]/70 via-transparent to-transparent" />

      {/* Featured Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
        <span className="px-3 py-1 rounded-full bg-rose-600/90 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-lg shadow-rose-600/30 backdrop-blur-md">
          Featured Drama
        </span>
        <span className="px-2.5 py-1 rounded-full bg-black/40 text-amber-300 text-[11px] font-bold flex items-center space-x-1 backdrop-blur-md border border-white/10">
          <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
          <span>{drama.rating.toFixed(1)}</span>
        </span>
      </div>

      {/* Content & Action Buttons */}
      <div className="absolute bottom-0 inset-x-0 p-5 z-10 space-y-3">
        {/* Genre Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {drama.genres.map((g) => (
            <span
              key={g}
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/10 text-white/90 backdrop-blur-md border border-white/10"
            >
              {g}
            </span>
          ))}
          <span className="text-[11px] text-white/60 font-medium flex items-center space-x-1 pl-1">
            <Eye className="w-3 h-3" />
            <span>{(drama.viewsCount / 1000000).toFixed(1)}M views</span>
          </span>
        </div>

        {/* Title */}
        <h1
          onClick={() => onDetails(drama)}
          className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight leading-tight drop-shadow cursor-pointer line-clamp-2 hover:text-rose-400 transition-colors"
        >
          {drama.title}
        </h1>

        {/* Description */}
        <p className="text-xs text-white/70 line-clamp-2 leading-relaxed max-w-lg">
          {drama.description}
        </p>

        {/* CTA Buttons */}
        <div className="flex items-center space-x-3 pt-1">
          <button
            id={`hero-watch-btn-${drama.id}`}
            onClick={() => onWatch(drama)}
            className="flex-1 py-3 px-5 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 shadow-xl shadow-rose-600/30 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white text-white" />
            <span>Start Watching</span>
          </button>

          <button
            id={`hero-save-btn-${drama.id}`}
            onClick={() => onToggleSave(drama)}
            className={`py-3 px-4 rounded-2xl border active:scale-95 font-bold text-xs flex items-center space-x-1.5 backdrop-blur-md transition-all cursor-pointer ${
              isSaved
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                : 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
            }`}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 text-white" />
                <span>My Shows</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

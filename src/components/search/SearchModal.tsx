import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search as SearchIcon, X, Film, Star, Play, Sparkles } from 'lucide-react';
import { Drama } from '../../types';
import { dramaRepository } from '../../repositories/dramaRepository';
import { DramaCover } from '../common/DramaCover';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDrama: (drama: Drama) => void;
  onHaptic: (type?: 'light' | 'medium' | 'heavy' | 'selection') => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectDrama,
  onHaptic,
}) => {
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [genres, setGenres] = useState<string[]>([]);
  const [allDramas, setAllDramas] = useState<Drama[]>([]);

  useEffect(() => {
    if (isOpen) {
      dramaRepository.getAllDramas().then(setAllDramas);
      dramaRepository.getGenres().then(setGenres);
    }
  }, [isOpen]);

  const filteredDramas = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    const cleanGenre = selectedGenre.toLowerCase();

    return allDramas.filter((drama) => {
      const matchesQuery =
        !cleanQuery ||
        drama.title.toLowerCase().includes(cleanQuery) ||
        drama.description.toLowerCase().includes(cleanQuery) ||
        drama.tags.some((t) => t.toLowerCase().includes(cleanQuery));

      const matchesGenre =
        cleanGenre === 'all' ||
        drama.genres.some((g) => g.toLowerCase() === cleanGenre);

      return matchesQuery && matchesGenre;
    });
  }, [allDramas, query, selectedGenre]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="search-modal-container"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-[#08090c] text-white flex flex-col pt-safe pb-safe"
        >
          {/* Search Header Input */}
          <div className="px-4 py-3 border-b border-white/[0.08] flex items-center space-x-3">
            <div className="flex-1 relative flex items-center">
              <SearchIcon className="absolute left-3.5 w-4 h-4 text-white/40 pointer-events-none" />
              <input
                id="search-drama-input"
                type="text"
                autoFocus
                placeholder="Search dramas, billionaire, revenge..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white/[0.07] border border-white/10 text-white placeholder-white/40 text-sm focus:outline-none focus:border-rose-500 transition-colors"
              />
              {query && (
                <button
                  id="clear-search-btn"
                  onClick={() => setQuery('')}
                  className="absolute right-3 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white/70"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              id="close-search-btn"
              onClick={onClose}
              className="text-xs font-bold text-white/70 hover:text-white px-2 py-2"
            >
              Cancel
            </button>
          </div>

          {/* Quick Genre Pills */}
          <div className="px-4 py-2.5 border-b border-white/[0.04] flex space-x-2 overflow-x-auto no-scrollbar">
            {['All', ...genres].map((g) => (
              <button
                key={g}
                id={`search-genre-${g.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => {
                  setSelectedGenre(g);
                  onHaptic('selection');
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
                  selectedGenre.toLowerCase() === g.toLowerCase()
                    ? 'bg-rose-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Results List / Grid */}
          <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
            {filteredDramas.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {filteredDramas.map((drama) => (
                  <div
                    key={drama.id}
                    id={`search-result-${drama.id}`}
                    onClick={() => {
                      onClose();
                      onSelectDrama(drama);
                    }}
                    className="bg-[#12141c] rounded-2xl overflow-hidden border border-white/5 cursor-pointer group hover:border-rose-500/40 transition-all"
                  >
                    <div className="relative aspect-[2/3] w-full bg-black/40 overflow-hidden">
                      <DramaCover
                        src={drama.coverImage || drama.poster || drama.backdrop}
                        alt={drama.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-bold text-white">
                        {drama.totalEpisodes} eps
                      </div>
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
                        {drama.genres.join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty Search State */
              <div className="h-64 flex flex-col items-center justify-center text-center space-y-3 text-white/50">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Film className="w-6 h-6 text-white/30" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">No dramas found</p>
                  <p className="text-xs text-white/40 max-w-xs">
                    Try searching for another title, tag, or select a different genre above.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

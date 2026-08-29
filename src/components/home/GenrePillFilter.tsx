import React from 'react';

interface GenrePillFilterProps {
  genres: string[];
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
}

export const GenrePillFilter: React.FC<GenrePillFilterProps> = ({
  genres,
  selectedGenre,
  onSelectGenre,
}) => {
  const allGenres = ['All', ...genres];

  return (
    <div className="flex space-x-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
      {allGenres.map((genre) => {
        const isSelected = selectedGenre.toLowerCase() === genre.toLowerCase();

        return (
          <button
            key={genre}
            id={`genre-pill-${genre.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => onSelectGenre(genre)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
              isSelected
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 border border-rose-500'
                : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/70 border border-white/[0.08]'
            }`}
          >
            {genre}
          </button>
        );
      })}
    </div>
  );
};

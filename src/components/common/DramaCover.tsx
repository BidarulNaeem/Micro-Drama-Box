import React, { useState } from 'react';
import { Film } from 'lucide-react';

interface DramaCoverProps {
  src?: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export const DramaCover: React.FC<DramaCoverProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  loading = 'lazy',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (!src || hasError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#1b1e2a] via-[#12141c] to-[#0c0d12] flex flex-col items-center justify-center p-2 text-center select-none">
        <Film className="w-5 h-5 text-rose-500/30 mb-1" />
        <span className="text-[10px] font-bold text-white/30 line-clamp-1 uppercase tracking-wider">
          {alt || 'Drama'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#151720]">
      {/* Background skeleton while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-tr from-[#141620] via-[#1c202d] to-[#141620] animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        loading={loading}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`${className} transition-opacity duration-300 ease-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};


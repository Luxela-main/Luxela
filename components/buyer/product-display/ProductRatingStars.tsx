'use client';

import { Star } from 'lucide-react';

interface ProductRatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showText?: boolean;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export default function ProductRatingStars({
  rating,
  reviewCount,
  size = 'md',
  showText = true,
  interactive = false,
  onRate,
}: ProductRatingStarsProps) {
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const textSizeMap = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <button
            key={i}
            onClick={() => interactive && onRate && onRate(i + 1)}
            className={`transition-transform ${
              interactive ? 'hover:scale-125 cursor-pointer' : ''
            }`}
            disabled={!interactive}
          >
            <Star
              className={`${sizeMap[size]} ${
                i < Math.round(rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-600'
              }`}
            />
          </button>
        ))}
      </div>

      {showText && (
        <span className={`${textSizeMap[size]} text-[#acacac]`}>
          {rating.toFixed(1)}
          {reviewCount && (
            <span className="text-[#666] ml-1">({reviewCount})</span>
          )}
        </span>
      )}
    </div>
  );
}
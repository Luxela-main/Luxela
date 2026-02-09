'use client';

import { useRef, useState, useEffect } from 'react';
import EnhancedCollectionCard from './EnhancedCollectionCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CollectionShowcaseProps {
  collections: any[];
  title?: string;
  showControls?: boolean;
  variant?: 'carousel' | 'grid';
}

export default function CollectionShowcase({
  collections,
  title = 'Featured Collections',
  showControls = true,
  variant = 'carousel',
}: CollectionShowcaseProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', checkScrollButtons);
      return () => carousel.removeEventListener('scroll', checkScrollButtons);
    }
  }, [collections]);

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -300 : 300,
        behavior: 'smooth',
      });
    }
  };

  if (variant === 'grid') {
    return (
      <section className="mb-16 relative">
        <div className="flex items-center justify-between mb-4 sm:mb-8 px-4 sm:px-0">
          {title && (
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">{title}</h2>
          )}
          {showControls && collections.length > 3 && (
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={`p-1.5 sm:p-2 rounded-full transition-all ${
                  canScrollLeft
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/50'
                    : 'bg-[#2a2a2a] text-[#555] cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={`p-1.5 sm:p-2 rounded-full transition-all ${
                  canScrollRight
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/50'
                    : 'bg-[#2a2a2a] text-[#555] cursor-not-allowed'
                }`}
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <EnhancedCollectionCard
              key={collection.id}
              collection={collection}
              variant="featured"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-16 relative">
      {title && (
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">{title}</h2>
        </div>
      )}
      {showControls && (
        <div className="flex gap-2 px-4 sm:px-0 mb-4 sm:mb-8 sm:absolute sm:top-0 sm:right-0">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`p-1.5 sm:p-2 rounded-full transition-all ${
              canScrollLeft
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/50'
                : 'bg-[#2a2a2a] text-[#555] cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`p-1.5 sm:p-2 rounded-full transition-all ${
              canScrollRight
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/50'
                : 'bg-[#2a2a2a] text-[#555] cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      )}

      <div className="px-4 sm:px-0">
        <div
          ref={carouselRef}
          className="flex gap-3 sm:gap-5 overflow-x-auto scrollbar-hide transition-all"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {collections.map((collection) => (
            <div key={collection.id} className="min-w-[calc(100vw-80px)] sm:min-w-[280px] flex-shrink-0 transition-transform duration-300 hover:scale-105">
              <EnhancedCollectionCard collection={collection} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
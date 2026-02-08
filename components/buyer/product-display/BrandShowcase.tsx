'use client';

import { useRef, useState, useEffect } from 'react';
import EnhancedBrandCard from './EnhancedBrandCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BrandShowcaseProps {
  brands: any[];
  title?: string;
  showControls?: boolean;
  variant?: 'carousel' | 'grid';
  columns?: number;
}

export default function BrandShowcase({
  brands,
  title = 'Featured Brands',
  showControls = true,
  variant = 'grid',
  columns = 3,
}: BrandShowcaseProps) {
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
  }, [brands]);

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -300 : 300,
        behavior: 'smooth',
      });
    }
  };

  if (variant === 'grid') {
    const colClasses = {
      2: 'md:grid-cols-2',
      3: 'md:grid-cols-3',
      4: 'md:grid-cols-4',
      5: 'md:grid-cols-5',
      6: 'md:grid-cols-6',
    };

    return (
      <section className="mb-16 relative">
        <div className="flex items-center justify-between mb-4 sm:mb-8 px-4 sm:px-0">
          {title && (
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          )}
          {showControls && brands.length > columns && (
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={`p-1.5 sm:p-2 rounded-full transition-all ${
                  canScrollLeft
                    ? 'bg-[#8451E1] hover:bg-[#9468F2]'
                    : 'bg-[#333] text-[#666] cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={`p-1.5 sm:p-2 rounded-full transition-all ${
                  canScrollRight
                    ? 'bg-[#8451E1] hover:bg-[#9468F2]'
                    : 'bg-[#333] text-[#666] cursor-not-allowed'
                }`}
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </div>
        <div className={`grid grid-cols-1 ${colClasses[columns as keyof typeof colClasses] || 'md:grid-cols-3'} gap-6`}>
          {brands.map((brand) => (
            <EnhancedBrandCard
              key={brand.id}
              brand={brand}
              variant="featured"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-16 relative">
      <div className="flex items-center justify-between mb-4 sm:mb-8 px-4 sm:px-0">
        {title && (
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        )}
        {showControls && (
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`p-1.5 sm:p-2 rounded-full transition-all ${
                canScrollLeft
                  ? 'bg-[#8451E1] hover:bg-[#9468F2]'
                  : 'bg-[#333] text-[#666] cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`p-1.5 sm:p-2 rounded-full transition-all ${
                canScrollRight
                  ? 'bg-[#8451E1] hover:bg-[#9468F2]'
                  : 'bg-[#333] text-[#666] cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={carouselRef}
        className="flex gap-3 sm:gap-5 overflow-x-auto scrollbar-hide px-4 sm:px-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {brands.map((brand) => (
          <div key={brand.id} className="min-w-[calc(100vw-80px)] sm:min-w-[280px] flex-shrink-0">
            <EnhancedBrandCard brand={brand} />
          </div>
        ))}
      </div>
    </section>
  );
}
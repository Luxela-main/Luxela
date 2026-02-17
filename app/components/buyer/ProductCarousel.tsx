'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { UnifiedListingCard } from './product-display/UnifiedListingCard';

interface ProductCarouselProps {
  title: string;
  products: any[];
  categoryIcon?: string;
}

export default function ProductCarousel({ title, products, categoryIcon }: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShowLeftArrow(container.scrollLeft > 0);
      setShowRightArrow(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    };

    handleScroll();
    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 400;
    const targetScroll =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="relative group overflow-hidden w-full">
      {/* Left Arrow */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-[#0a0a0a] via-[#1a0a2e] to-transparent p-3 rounded-r-lg hover:from-[#1a0a2e] transition-all duration-300 shadow-lg"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 text-[#8451E1]" />
        </button>
      )}

      {/* Carousel Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 sm:gap-5 md:gap-6 overflow-x-auto overflow-y-hidden scroll-smooth pb-2 w-full max-h-[500px]"
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {products.map((product, index) => (
          <div
            key={product.id || index}
            className="flex-shrink-0 w-52 sm:w-64 md:w-72 animate-fade-in overflow-hidden"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <UnifiedListingCard product={product} />
          </div>
        ))}
      </div>

      {/* Right Arrow */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-l from-[#0a0a0a] via-[#1a0a2e] to-transparent p-3 rounded-l-lg hover:from-[#1a0a2e] transition-all duration-300 shadow-lg"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-[#8451E1]" />
        </button>
      )}
    </div>
  );
}
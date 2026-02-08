'use client';

import { Listing } from '@/types/listing';
import UnifiedListingCard from './UnifiedListingCard';
import { InfinityScrollLoader } from '@/components/loader/infinity-scroll-loader';
import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductDisplayGridProps {
  products: Listing[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  layout?: 'compact' | 'normal' | 'comfortable';
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  emptyMessage?: string;
  showActions?: {
    wishlist?: boolean;
    quickView?: boolean;
    share?: boolean;
  };
  enableHorizontalScroll?: boolean;
}

export default function ProductDisplayGrid({
  products,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  layout = 'normal',
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  emptyMessage = 'No products found. Try adjusting your filters or search.',
  showActions = {
    wishlist: true,
    quickView: true,
    share: true,
  },
  enableHorizontalScroll = true,
}: ProductDisplayGridProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const layoutClasses = {
    compact: 'gap-3 md:gap-4',
    normal: 'gap-4 md:gap-5 lg:gap-6',
    comfortable: 'gap-6 md:gap-7 lg:gap-8',
  };

  // Check scroll position for horizontal scrolling indicators
  const checkScroll = () => {
    if (scrollContainerRef.current && enableHorizontalScroll) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container && enableHorizontalScroll) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [products, enableHorizontalScroll]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth',
      });
      setIsScrolling(true);
      setTimeout(() => setIsScrolling(false), 600);
    }
  };

  // Static column classes - Tailwind can't process dynamic classes
  const getColumnClass = () => {
    const mobile = columns.mobile || 2;
    const tablet = columns.tablet || 3;
    const desktop = columns.desktop || 4;
    
    const mobileClass = mobile === 1 ? 'grid-cols-1' : mobile === 2 ? 'grid-cols-2' : mobile === 3 ? 'grid-cols-3' : 'grid-cols-4';
    const tabletClass = tablet === 1 ? 'md:grid-cols-1' : tablet === 2 ? 'md:grid-cols-2' : tablet === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4';
    const desktopClass = desktop === 1 ? 'lg:grid-cols-1' : desktop === 2 ? 'lg:grid-cols-2' : desktop === 3 ? 'lg:grid-cols-3' : desktop === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-5';
    
    return `${mobileClass} ${tabletClass} ${desktopClass}`;
  };

  const gridClass = `grid ${layoutClasses[layout]} ${getColumnClass()}`;

  return (
    <div className="w-full">
      {/* Loading Skeleton */}
      {isLoading && products.length === 0 && (
        <div className="px-4 md:px-6 lg:px-8">
          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6`}>
            {[...Array(columns.desktop || 4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-80 md:h-96 bg-[#222] rounded-lg mb-4" />
                <div className="h-4 bg-[#222] rounded mb-2" />
                <div className="h-3 bg-[#222] rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#222] rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-[#666]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No Products Found
            </h3>
            <p className="text-[#acacac] text-sm">{emptyMessage}</p>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {products.length > 0 && (
        <>
          {/* Desktop Grid/Carousel View */}
          <div className="hidden md:block px-4 md:px-6 lg:px-8">
            <div className="relative">
              {/* Desktop Carousel with Scroll Buttons */}
              {enableHorizontalScroll && products.length > (columns.desktop || 4) && (
                <>
                  {/* Left Scroll Button */}
                  {canScrollLeft && (
                    <button
                      onClick={() => scroll('left')}
                      className="absolute -left-4 top-1/2 -translate-y-1/2 p-2 bg-[#8451E1] hover:bg-[#9468F2] text-white rounded-full shadow-lg z-10 transition-all hover:scale-110 active:scale-95"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  
                  {/* Right Scroll Button */}
                  {canScrollRight && (
                    <button
                      onClick={() => scroll('right')}
                      className="absolute -right-4 top-1/2 -translate-y-1/2 p-2 bg-[#8451E1] hover:bg-[#9468F2] text-white rounded-full shadow-lg z-10 transition-all hover:scale-110 active:scale-95"
                      aria-label="Scroll right"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}

                  {/* Scrollable Grid Container */}
                  <div
                    ref={scrollContainerRef}
                    className="flex gap-4 md:gap-5 lg:gap-6 overflow-x-auto scrollbar-hide pr-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {products && products.length > 0 && products.map((product) => (
                      <div key={product.id} className="flex-shrink-0" style={{ minWidth: `calc((100% - ${(products.length - 1) * 24}px) / ${columns.desktop || 4})` }}>
                        <UnifiedListingCard
                          listing={product}
                          showWishlist={showActions.wishlist}
                          showQuickView={showActions.quickView}
                          showShare={showActions.share}
                          variant="product"
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Standard Grid View (when not enough items or scroll disabled) */}
              {!enableHorizontalScroll || products.length <= (columns.desktop || 4) && (
                <div className={gridClass}>
                  {products && products.length > 0 && products.map((product) => (
                    <UnifiedListingCard
                      key={product.id}
                      listing={product}
                      showWishlist={showActions.wishlist}
                      showQuickView={showActions.quickView}
                      showShare={showActions.share}
                      variant="product"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Horizontal Scroll */}
          {enableHorizontalScroll && (
            <div className="block md:hidden">
              <div className="relative">
                {/* Scroll Container */}
                <div
                  ref={scrollContainerRef}
                  className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {products && products.length > 0 && products.map((product) => (
                    <div key={product.id} className="flex-shrink-0 w-[calc(50vw-12px)]">
                      <UnifiedListingCard
                        listing={product}
                        showWishlist={showActions.wishlist}
                        showQuickView={showActions.quickView}
                        showShare={showActions.share}
                        variant="product"
                      />
                    </div>
                  ))}
                </div>

                {/* Scroll Indicators */}
                {canScrollLeft && (
                  <button
                    onClick={() => scroll('left')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-[#8451E1] hover:bg-[#9468F2] text-white rounded-full shadow-lg z-10 transition-all hover:scale-110 active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}

                {canScrollRight && (
                  <button
                    onClick={() => scroll('right')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-[#8451E1] hover:bg-[#9468F2] text-white rounded-full shadow-lg z-10 transition-all hover:scale-110 active:scale-95"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Load More Button */}
          {hasMore && onLoadMore && (
            <div className="flex justify-center mt-8 md:mt-12 px-4">
              <button
                onClick={onLoadMore}
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-[#8451E1] to-[#5C2EAF] text-white font-medium hover:shadow-lg hover:shadow-[#8451E1]/50 transition-all hover:scale-105 active:scale-95"
              >
                Load More Products
              </button>
            </div>
          )}

          {/* Infinite Scroll Indicator */}
          {hasMore && <InfinityScrollLoader onVisible={onLoadMore} />}
        </>
      )}

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
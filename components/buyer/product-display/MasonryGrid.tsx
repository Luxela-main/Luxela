'use client';

import { Listing } from '@/types/listing';
import UnifiedListingCard from './UnifiedListingCard';
import { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import '@/styles/masonry.css';

interface MasonryGridProps {
  products: Listing[];
  isLoading?: boolean;
  emptyMessage?: string;
  showActions?: {
    wishlist?: boolean;
    quickView?: boolean;
    share?: boolean;
  };
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'compact' | 'normal' | 'comfortable';
}

export default function MasonryGrid({
  products,
  isLoading = false,
  emptyMessage = 'No products found. Try adjusting your filters or search.',
  showActions = {
    wishlist: true,
    quickView: true,
    share: true,
  },
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  gap = 'normal',
}: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(columns.desktop || 4);
  const [itemHeights, setItemHeights] = useState<Record<string, number>>({});

  const gapMap = {
    compact: '12px',
    normal: '16px',
    comfortable: '24px',
  };

  const gapValue = gapMap[gap];

  // Handle responsive column changes
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = window.innerWidth;
        
        if (width < 768) {
          setColumnCount(columns.mobile || 2);
        } else if (width < 1024) {
          setColumnCount(columns.tablet || 3);
        } else {
          setColumnCount(columns.desktop || 4);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [columns]);

  // Calculate column positions using the masonry algorithm
  const getColumnGridPositions = () => {
    const columnHeights = Array(columnCount).fill(0);
    const positions: Array<{ column: number; row: number }> = [];

    products.forEach((product, index) => {
      // Find the column with the smallest height
      const minColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      
      // Get item height or use default
      const itemHeight = itemHeights[product.id] || 420;
      
      // Update column height
      columnHeights[minColumnIndex] += itemHeight + parseFloat(gapValue);

      positions.push({
        column: minColumnIndex,
        row: columnHeights[minColumnIndex],
      });
    });

    return { positions, columnHeights };
  };

  const { positions, columnHeights } = getColumnGridPositions();
  const maxHeight = Math.max(...columnHeights, 0);

  const handleItemMount = (id: string, height: number) => {
    setItemHeights((prev) => {
      if (prev[id] !== height) {
        return { ...prev, [id]: height };
      }
      return prev;
    });
  };

  return (
    <div className="w-full">
      {/* Loading Skeleton */}
      {isLoading && products.length === 0 && (
        <div className="px-4 md:px-6 lg:px-8">
          <div 
            className="grid gap-4 md:gap-5 lg:gap-6"
            style={{
              gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`
            }}
          >
            {[...Array(columnCount)].map((_, i) => (
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

      {/* Masonry Grid */}
      {products.length > 0 && (
        <div className="px-4 md:px-6 lg:px-8">
          <div
            ref={containerRef}
            className="grid auto-rows-max w-full masonry-grid"
            style={{
              gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
              gap: gapValue,
              minHeight: `${maxHeight}px`,
            }}
          >
            {products.map((product, index) => (
              <div key={product.id} className="masonry-item">
                    <MasonryItem
                    product={product}
                    showWishlist={showActions.wishlist}
                    showQuickView={showActions.quickView}
                    showShare={showActions.share}
                    onHeightChange={(height) => handleItemMount(product.id, height)}
                  />
              </div>
            ))}
          </div>
        </div>
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

// Masonry Item Component with Height Detection
const MasonryItem = memo(function MasonryItem({
  product,
  showWishlist,
  showQuickView,
  showShare,
  onHeightChange,
}: {
  product: Listing;
  showWishlist?: boolean;
  showQuickView?: boolean;
  showShare?: boolean;
  onHeightChange: (height: number) => void;
}) {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (itemRef.current) {
        const height = itemRef.current.offsetHeight;
        onHeightChange(height);
      }
    });

    if (itemRef.current) {
      observer.observe(itemRef.current);
    }

    return () => observer.disconnect();
  }, [onHeightChange]);

  return (
    <div
      ref={itemRef}
      className="w-full transition-all duration-300 ease-out hover:scale-[1.02]"
      style={{
        transformOrigin: 'center top',
      }}
    >
      <UnifiedListingCard
        listing={product}
        showWishlist={showWishlist}
        showQuickView={showQuickView}
        showShare={showShare}
        variant="product"
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Memoization comparison - re-render only if these change
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.showWishlist === nextProps.showWishlist &&
    prevProps.showQuickView === nextProps.showQuickView &&
    prevProps.showShare === nextProps.showShare
  );
});

MasonryItem.displayName = 'MasonryItem';
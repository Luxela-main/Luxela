'use client';

import { Heart, Share2, Eye } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface ProductDisplayGridProps {
  products: any[];
  isLoading?: boolean;
  layout?: 'normal' | 'masonry';
  columns?: { mobile: number; tablet: number; desktop: number };
  showActions?: {
    wishlist?: boolean;
    quickView?: boolean;
    share?: boolean;
  };
  emptyMessage?: string;
  enableHorizontalScroll?: boolean;
}

export function ProductDisplayGrid({
  products = [],
  isLoading = false,
  layout = 'normal',
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  showActions = { wishlist: true, quickView: true, share: true },
  emptyMessage = 'No products available',
  enableHorizontalScroll = false,
}: ProductDisplayGridProps) {
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  const toggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const newWishlist = new Set(wishlist);
    if (newWishlist.has(productId)) {
      newWishlist.delete(productId);
    } else {
      newWishlist.add(productId);
    }
    setWishlist(newWishlist);
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 rounded-2xl aspect-square animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Handle empty state
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 px-4">
        <div className="relative w-16 sm:w-20 h-16 sm:h-20 mb-4 sm:mb-6 flex items-center justify-center">
          <div className="text-4xl sm:text-5xl">📦</div>
        </div>
        <h3 className="text-white text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
          {emptyMessage.split('.')[0]}
        </h3>
        <p className="text-[#999] text-sm sm:text-base text-center max-w-md">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/buyer/product/${product.id}`}
          className="group relative h-full"
        >
          <div className="relative bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 backdrop-blur-xl border border-[#8451E1]/20 rounded-2xl overflow-hidden hover:border-[#8451E1]/60 transition-all duration-500 h-full flex flex-col hover:shadow-[0_0_50px_rgba(132,81,225,0.2)]">
            {/* Product Image */}
            <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-[#0a0a0a] to-[#1a0a2e]">
              {product.images?.[0]?.url || product.image_url ? (
                <Image
                  src={product.images?.[0]?.url || product.image_url || '/placeholder.jpg'}
                  alt={product.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#666]">
                  <span className="text-4xl">👗</span>
                </div>
              )}

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3">
                {showActions?.quickView && (
                  <button className="p-2 sm:p-3 rounded-full bg-[#8451E1]/80 hover:bg-[#8451E1] transition-all text-white">
                    <Eye className="w-4 sm:w-5 h-4 sm:h-5" />
                  </button>
                )}
                {showActions?.share && (
                  <button className="p-2 sm:p-3 rounded-full bg-[#8451E1]/80 hover:bg-[#8451E1] transition-all text-white">
                    <Share2 className="w-4 sm:w-5 h-4 sm:h-5" />
                  </button>
                )}
              </div>

              {/* Wishlist button */}
              {showActions?.wishlist && (
                <button
                  onClick={(e) => toggleWishlist(product.id, e)}
                  className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 sm:p-2.5 rounded-full bg-black/60 backdrop-blur-md hover:bg-[#8451E1] transition-all z-10"
                >
                  <Heart
                    className={`w-4 sm:w-5 h-4 sm:h-5 transition-all ${
                      wishlist.has(product.id)
                        ? 'fill-[#FF6B6B] text-[#FF6B6B]'
                        : 'text-white hover:text-[#8451E1]'
                    }`}
                  />
                </button>
              )}

              {/* Stock badge */}
              {product.quantity_available === 0 && (
                <div className="absolute top-3 sm:top-4 left-3 sm:left-4 px-2 sm:px-3 py-1 bg-red-500/80 rounded-lg text-xs text-white font-semibold">
                  Out of Stock
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-3 sm:p-4 flex-1 flex flex-col">
              {/* Brand */}
              {product.sellers?.seller_business?.[0]?.brand_name && (
                <p className="text-[#8451E1] text-xs sm:text-xs font-semibold tracking-wider uppercase mb-1 sm:mb-2 truncate">
                  {product.sellers.seller_business[0].brand_name}
                </p>
              )}

              {/* Title */}
              <h3 className="text-white text-xs sm:text-sm font-semibold line-clamp-2 mb-2 sm:mb-3 group-hover:text-[#8451E1] transition-colors">
                {product.title}
              </h3>

              {/* Price */}
              <div className="mt-auto">
                {product.price_cents ? (
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-[#8451E1] to-[#c084fc] bg-clip-text text-transparent">
                      ₦{(product.price_cents / 100).toLocaleString('en-NG', {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                    {product.original_price_cents && product.original_price_cents > product.price_cents && (
                      <span className="text-[#666] line-through text-xs sm:text-sm">
                        ₦{(product.original_price_cents / 100).toLocaleString('en-NG', {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    )}
                  </div>
                ) : null}

                {/* Colors available */}
                {product.colors_available && (
                  <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                    {(typeof product.colors_available === 'string'
                      ? product.colors_available.split(',')
                      : product.colors_available
                    )
                      .slice(0, 3)
                      .map((color: string, idx: number) => (
                        <div
                          key={idx}
                          className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-[#8451E1]/50"
                          title={color}
                          style={{
                            backgroundColor: getColorHex(color),
                          }}
                        />
                      ))}
                    {product.colors_available &&
                      (typeof product.colors_available === 'string'
                        ? product.colors_available.split(',').length
                        : product.colors_available.length) > 3 && (
                        <span className="text-[#666] text-xs self-center">
                          +{(typeof product.colors_available === 'string' ? product.colors_available.split(',').length : product.colors_available.length) - 3}
                        </span>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
      </div>
    </div>
  );
}

// Helper function to get color hex from color name
function getColorHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    black: '#000000',
    white: '#ffffff',
    burgundy: '#800020',
    blue: '#1a1a3e',
    navy: '#1a1a3e',
    gold: '#d4af37',
    silver: '#c0c0c0',
    pink: '#f3e5e8',
    blush: '#f3e5e8',
    charcoal: '#36454f',
    taupe: '#b38b6d',
    green: '#50c878',
    emerald: '#50c878',
    red: '#ff0000',
    yellow: '#ffff00',
    orange: '#ff8c00',
    brown: '#8b4513',
    gray: '#808080',
  };

  const normalized = colorName.toLowerCase().trim();
  return colorMap[normalized] || '#808080';
}
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Share2, Eye } from 'lucide-react';
import { useState } from 'react';

interface MasonryGridProps {
  products: any[];
  isLoading?: boolean;
  showActions?: {
    wishlist?: boolean;
    quickView?: boolean;
    share?: boolean;
  };
}

export function MasonryGrid({
  products = [],
  isLoading = false,
  showActions = { wishlist: true, quickView: true, share: true },
}: MasonryGridProps) {
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

  if (isLoading) {
    return (
      <div className="columns-2 sm:columns-3 md:columns-4 gap-4 sm:gap-6 space-y-4 sm:space-y-6">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="break-inside-avoid bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 rounded-2xl aspect-square animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 px-4">
        <div className="text-4xl sm:text-5xl mb-4">📦</div>
        <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">No products found</h3>
        <p className="text-[#999] text-sm sm:text-base">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="columns-2 sm:columns-3 md:columns-4 gap-4 sm:gap-6 space-y-4 sm:space-y-6">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/buyer/product/${product.id}`}
          className="group relative break-inside-avoid"
        >
          <div className="relative bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 backdrop-blur-xl border border-[#8451E1]/20 rounded-2xl overflow-hidden hover:border-[#8451E1]/60 transition-all duration-500 hover:shadow-[0_0_50px_rgba(132,81,225,0.2)]">
            {/* Product Image */}
            <div className="relative w-full overflow-hidden bg-gradient-to-br from-[#0a0a0a] to-[#1a0a2e]">
              {product.images?.[0]?.url || product.image_url ? (
                <Image
                  src={product.images?.[0]?.url || product.image_url}
                  alt={product.title}
                  width={400}
                  height={500}
                  className="w-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center text-[#666]">
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
            </div>

            {/* Product Info */}
            <div className="p-3 sm:p-4">
              {/* Brand */}
              {product.sellers?.seller_business?.[0]?.brand_name && (
                <p className="text-[#8451E1] text-xs font-semibold tracking-wider uppercase mb-1 sm:mb-2 truncate">
                  {product.sellers.seller_business[0].brand_name}
                </p>
              )}

              {/* Title */}
              <h3 className="text-white text-xs sm:text-sm font-semibold line-clamp-2 mb-2 sm:mb-3 group-hover:text-[#8451E1] transition-colors">
                {product.title}
              </h3>

              {/* Price */}
              {product.price_cents && (
                <div className="flex items-baseline gap-2">
                  <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-[#8451E1] to-[#c084fc] bg-clip-text text-transparent">
                    ₦{(product.price_cents / 100).toLocaleString('en-NG', {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
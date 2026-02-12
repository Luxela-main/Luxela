'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { trpc } from '@/lib/trpc-client';

interface Product {
  id: string;
  title: string;
  price_cents?: number;
  currency?: string;
  primary_image?: string;
  image?: string;
  sellers?: {
    seller_business?: Array<{
      brand_name?: string;
    }>;
  };
  rating?: number;
  quantity_available?: number;
}

interface ProductCarouselProps {
  title: string;
  products: Product[];
  isFeatured?: boolean;
  categoryIcon?: string;
}

export default function ProductCarousel({
  title,
  products,
  isFeatured = false,
  categoryIcon = '📦',
}: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const addFavoriteMutation = trpc.buyer.addFavorite.useMutation();

  // Check scroll position
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleAddFavorite = async (productId: string) => {
    try {
      await addFavoriteMutation.mutateAsync({ listingId: productId });
      setFavorites(prev => new Set([...prev, productId]));
    } catch (error) {
      console.error('Failed to add favorite:', error);
    }
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="mb-12 sm:mb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xl sm:text-2xl">{categoryIcon}</span>
          <h2 className={isFeatured ? 'text-2xl sm:text-3xl font-light tracking-wide' : 'text-xl sm:text-2xl font-light'}>
            {title}
          </h2>
          <span className="text-xs sm:text-sm text-[#666] ml-2 sm:ml-3">
            {products.length} items
          </span>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Scroll Buttons */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 backdrop-blur-sm border border-[#333] rounded-full p-2 hover:bg-[#8451E1]/20 hover:border-[#8451E1] transition-all opacity-0 group-hover:opacity-100 duration-300"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 backdrop-blur-sm border border-[#333] rounded-full p-2 hover:bg-[#8451E1]/20 hover:border-[#8451E1] transition-all opacity-0 group-hover:opacity-100 duration-300"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Products Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 sm:gap-4 md:gap-6 lg:gap-8 overflow-x-auto scrollbar-hide"
          style={{ scrollBehavior: 'smooth' }}
        >
          {products.filter(p => p && p.id).map((product) => (
            <Link
              key={product.id}
              href={`/buyer/product/${product.id}`}
              className="flex-shrink-0 group/item w-40 sm:w-48 md:w-64 lg:w-72"
            >
              <div className={`bg-[#0f0f0f] border border-[#222] rounded-lg overflow-hidden hover:border-[#8451E1]/50 transition-all duration-300 h-full flex flex-col hover:shadow-lg hover:shadow-[#8451E1]/10 ${
                isFeatured ? 'md:w-72 md:h-96' : ''
              }`}>
                {/* Image Container */}
                <div className="relative w-full aspect-square overflow-hidden bg-[#1a1a1a] flex-shrink-0">
                  {(product.primary_image || product.image) ? (
                    <Image
                      src={product.primary_image || product.image || ''}
                      alt={product.title}
                      fill
                      className="object-cover group-hover/item:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#444]">
                      <span className="text-4xl">📷</span>
                    </div>
                  )}

                  {/* Stock Badge */}
                  {product.quantity_available && product.quantity_available > 0 ? (
                    <div className="absolute top-2 right-2 bg-green-500/20 border border-green-500/50 rounded-full px-2 sm:px-3 py-1 text-xs font-medium text-green-400">
                      In Stock
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 bg-red-500/20 border border-red-500/50 rounded-full px-2 sm:px-3 py-1 text-xs font-medium text-red-400">
                      Out of Stock
                    </div>
                  )}

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddFavorite(product.id);
                    }}
                    className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm border border-[#333] rounded-full p-2 hover:bg-[#8451E1]/20 hover:border-[#8451E1] transition-all"
                  >
                    <Heart
                      className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                        favorites.has(product.id)
                          ? 'fill-[#8451E1] text-[#8451E1]'
                          : 'text-white'
                      }`}
                    />
                  </button>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4 md:p-5 flex-grow flex flex-col justify-between">
                  {/* Brand */}
                  {product.sellers?.seller_business?.[0]?.brand_name && (
                    <p className="text-xs text-[#666] uppercase tracking-widest font-medium mb-1 sm:mb-2 line-clamp-1">
                      {product.sellers.seller_business[0].brand_name}
                    </p>
                  )}

                  {/* Title */}
                  <h3 className="text-sm sm:text-base font-light line-clamp-2 mb-2 sm:mb-3 text-white group-hover/item:text-[#8451E1] transition-colors">
                    {product.title}
                  </h3>

                  {/* Price */}
                  {product.price_cents !== undefined && (
                    <div className="mt-auto pt-2 sm:pt-3 border-t border-[#222]">
                      <p className="text-sm sm:text-base font-light text-[#8451E1]">
                        ₦{Math.round(product.price_cents / 100).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
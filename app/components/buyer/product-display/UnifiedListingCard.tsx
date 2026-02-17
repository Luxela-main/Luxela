'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Share2, Eye, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartState } from '@/modules/cart/context';
import { useToast } from '@/components/hooks/useToast';
import { useAuth } from '@/context/AuthContext';

interface UnifiedListingCardProps {
  product: any;
  variant?: 'compact' | 'expanded';
  showActions?: {
    wishlist?: boolean;
    quickView?: boolean;
    share?: boolean;
  };
  onWishlistChange?: (productId: string, isWishlisted: boolean) => void;
}

export function UnifiedListingCard({
  product,
  variant = 'compact',
  showActions = { wishlist: true, quickView: true, share: true },
  onWishlistChange,
}: UnifiedListingCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCartState();
  const toast = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    const newState = !isWishlisted;
    setIsWishlisted(newState);
    onWishlistChange?.(product.id, newState);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.id) {
      toast?.error?.('Product information incomplete');
      return;
    }

    if (product.quantity_available === 0) {
      toast?.error?.('This product is out of stock');
      return;
    }

    try {
      setIsAddingToCart(true);
      await addToCart(product.id, 1);
      toast?.success?.(`✓ ${product.title} added to cart`);
    } catch (error: any) {
      const isAuthError =
        error.message?.includes('signed in') ||
        error.data?.code === 'UNAUTHORIZED';

      if (isAuthError) {
        router.push(`/signin?redirect=/buyer/browse`);
      } else {
        const errorMessage = error?.data?.message || error?.message || 'Failed to add item to cart';
        toast?.error?.(errorMessage);
      }
    } finally {
      setIsAddingToCart(false);
    }
  }

  return (
    <Link
      href={`/buyer/product/${product.id}`}
      className="group relative h-full"
    >
      <div className="relative bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 backdrop-blur-xl border border-[#8451E1]/20 rounded-2xl overflow-hidden hover:border-[#8451E1]/60 transition-all duration-500 h-full flex flex-col hover:shadow-[0_0_50px_rgba(132,81,225,0.2)] z-0 will-change-transform isolation-auto">
        {/* Product Image */}
        <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-[#0a0a0a] to-[#1a0a2e] flex-shrink-0 z-0">
          {product.images?.[0]?.url || product.image_url ? (
            <Image
              src={product.images?.[0]?.url || product.image_url}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
              priority={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#666]">
              <span className="text-4xl">👗</span>
            </div>
          )}

          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 z-20 pointer-events-none group-hover:pointer-events-auto">
            <button 
              onClick={handleAddToCart}
              disabled={isAddingToCart || product.quantity_available === 0}
              className="p-3 rounded-full bg-[#8451E1]/80 hover:bg-[#8451E1] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white relative z-20 cursor-pointer"
            >
              {isAddingToCart ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShoppingCart className="w-5 h-5" />
              )}
            </button>
            {showActions?.quickView && (
              <button className="p-3 rounded-full bg-[#8451E1]/80 hover:bg-[#8451E1] transition-all text-white relative z-20">
                <Eye className="w-5 h-5" />
              </button>
            )}
            {showActions?.share && (
              <button className="p-3 rounded-full bg-[#8451E1]/80 hover:bg-[#8451E1] transition-all text-white relative z-20">
                <Share2 className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Wishlist button */}
          {showActions?.wishlist && (
            <button
              onClick={handleWishlist}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 backdrop-blur-md hover:bg-[#8451E1] transition-all z-30"
            >
              <Heart
                className={`w-5 h-5 transition-all ${
                  isWishlisted
                    ? 'fill-[#FF6B6B] text-[#FF6B6B]'
                    : 'text-white hover:text-[#8451E1]'
                }`}
              />
            </button>
          )}

          {/* Stock badge */}
          {product.quantity_available === 0 && (
            <div className="absolute top-4 left-4 px-3 py-1 bg-red-500/80 rounded-lg text-xs text-white font-semibold z-20">
              Out of Stock
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 flex-1 flex flex-col z-0">
          {/* Brand */}
          {product.sellers?.seller_business?.[0]?.brand_name && (
            <p className="text-[#8451E1] text-xs font-semibold tracking-wider uppercase mb-2 truncate">
              {product.sellers.seller_business[0].brand_name}
            </p>
          )}

          {/* Title */}
          <h3 className="text-white text-sm font-semibold line-clamp-2 mb-3 group-hover:text-[#8451E1] transition-colors">
            {product.title}
          </h3>

          {variant === 'expanded' && product.description && (
            <p className="text-[#999] text-xs line-clamp-2 mb-3">{product.description}</p>
          )}

          {/* Price and colors */}
          <div className="mt-auto">
            {product.price_cents && (
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-lg font-bold bg-gradient-to-r from-[#8451E1] to-[#c084fc] bg-clip-text text-transparent">
                  ₦{(product.price_cents / 100).toLocaleString('en-NG', {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            )}

            {/* Colors available */}
            {product.colors_available && (
              <div className="flex gap-1.5 flex-wrap">
                {(typeof product.colors_available === 'string'
                  ? product.colors_available.split(',')
                  : product.colors_available
                )
                  .slice(0, 3)
                  .map((color: string, idx: number) => (
                    <div
                      key={idx}
                      className="w-3.5 h-3.5 rounded-full border border-[#8451E1]/50"
                      title={color}
                      style={{
                        backgroundColor: getColorHex(color),
                      }}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

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

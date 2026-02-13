'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Listing } from '@/types/listing';
import {
  ShoppingCart,
  Images,
  Check,
  Loader2,
  LogIn,
  Star,
  Shield,
  Zap,
  Heart,
  Share2,
  Eye,
  CheckCircle,
} from 'lucide-react';
import { useCartState } from '@/modules/cart/context';
import { useAuth } from '@/context/AuthContext';
import { toastSvc } from '@/services/toast';
import { useRouter } from 'next/navigation';
import { useListings } from '@/context/ListingsContext';
import { ApprovalBadge } from '../ApprovalBadge';
import HorizontalImageScroller from '@/components/HorizontalImageScroller';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '../../ui/button';

const UI_COLOR_MAP: { [key: string]: string } = {
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
  yellow: '#eab308',
  pink: '#ec4899',
  purple: '#a855f7',
  orange: '#f97316',
  black: '#000000',
  white: '#ffffff',
  brown: '#78350f',
  gray: '#6b7280',
};

interface EnhancedProductCardProps {
  product: Listing;
  showWishlist?: boolean;
  showQuickView?: boolean;
  showShare?: boolean;
  brandSlug?: string;
}

export default function EnhancedProductCard({
  product,
  showWishlist = true,
  showQuickView = true,
  showShare = true,
  brandSlug,
}: EnhancedProductCardProps) {
  const { addToCart } = useCartState();
  const { user } = useAuth();
  const router = useRouter();
  const { isListingApproved, validateProductForCart } = useListings();

  const isApproved = isListingApproved(product.id);

  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showQuickPreview, setShowQuickPreview] = useState(false);

  const business = product.sellers?.seller_business?.[0];
  const isSellerVerified = product.is_verified || false;
  const accentColors = ['#E5E7EB', '#6B7280', '#E5E7EB'];
  const cardAccent =
    accentColors[
      (product.id.charCodeAt(0) + product.id.charCodeAt(product.id.length - 1)) %
        accentColors.length
    ];

  // Get images for carousel
  const getImages = (): string[] => {
    try {
      if (product.imagesJson) {
        const parsed = JSON.parse(product.imagesJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse images:', e);
    }
    return product.image ? [product.image] : [];
  };

  const images = getImages();

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isApproved) {
      toastSvc.error('This product is not currently available.');
      return;
    }

    const validation = validateProductForCart(product.id);
    if (!validation.valid) {
      toastSvc.error(validation.reason || 'Cannot add this product to cart');
      return;
    }

    if (!user || !user.id) {
      setShowAuthModal(true);
      return;
    }

    if (isAdding) return;

    setIsAdding(true);
    try {
      await addToCart(product.id, 1);
      setAdded(true);
      const priceInNGN = product.price_cents ? (product.price_cents / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }) : 'Price unavailable';
      toastSvc.success(`✓ ${product.title} added to cart • ${priceInNGN}`);
      setTimeout(() => setAdded(false), 2000);
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Failed to add to cart. Please try again.';
      console.error('Failed to add to cart:', { message: errorMessage, error: err });
      toastSvc.error(errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  const LUXELA_PLACEHOLDER =
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop';

  const isValidImage =
    product.image &&
    product.image.length > 0 &&
    !product.image.includes('placeholder.com') &&
    product.image !== LUXELA_PLACEHOLDER;

  const colors = useMemo(() => {
    // Handle both formats - colors (from product endpoint) and colors_available (from collections)
    const colorsData = product.colors_available;
    if (!colorsData) return [];
    try {
      // If it's a string, parse it
      if (typeof colorsData === 'string') {
        const parsed = JSON.parse(colorsData);
        return Array.isArray(parsed) ? parsed : [];
      } else if (Array.isArray(colorsData)) {
        // If it's already an array, return it
        return colorsData;
      }
      return [];
    } catch (e) {
      // Fallback: try to split by comma if it's a string
      if (typeof colorsData === 'string') {
        return colorsData.split(',').map((c) => ({
          colorName: c.trim(),
          colorHex: '',
        }));
      }
      return [];
    }
  }, [product.colors_available]);

  const stockStatus =
    product.quantity_available === 0
      ? 'out-of-stock'
      : product.quantity_available <= 5
        ? 'low-stock'
        : 'in-stock';

  return (
    <>
      <div className="group relative h-full flex flex-col">
        <Link href={brandSlug ? `/buyer/product/${product.id}?brand=${brandSlug}` : `/buyer/product/${product.id}`} className="block flex-1">
          <div
            className="relative h-full bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-xl overflow-hidden transition-all duration-300 shadow-lg border-2"
            style={{
              borderColor: cardAccent + '40',
              boxShadow: `0 4px 20px ${cardAccent}10`,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = cardAccent + '80';
              el.style.boxShadow = `0 8px 40px ${cardAccent}30`;
              el.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = cardAccent + '40';
              el.style.boxShadow = `0 4px 20px ${cardAccent}10`;
              el.style.transform = 'translateY(0)';
            }}
          >
            {/* Image Section with Carousel */}
            <div className="relative bg-[#222] overflow-visible flex-shrink-0" style={{ height: '256px' }}>
              {isValidImage && images.length > 0 ? (
                <>
                  <HorizontalImageScroller
                    images={images}
                    alt={product.title}
                    showThumbnails={false}
                    showDots={images.length > 1}
                    autoScroll={false}
                    className="h-64"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Images className="w-12 h-12 text-gray-700" />
                </div>
              )}

              {/* Badges Section */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {/* Approval Badge */}
                <ApprovalBadge isApproved={isApproved} showText={false} />

                {/* Pending Review Badge */}
                {product.status === 'pending_review' && (
                  <div className="px-3 py-1.5 rounded-lg bg-yellow-500/20 backdrop-blur-md flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                    <span className="text-[9px] text-yellow-400 font-medium">
                      Pending
                    </span>
                  </div>
                )}

                {product.limited_edition_badge === 'show_badge' && (
                  <div
                    className="px-3 py-1.5 rounded-lg font-medium uppercase text-white text-xs backdrop-blur-md"
                    style={{
                      backgroundColor: cardAccent,
                      boxShadow: `0 0 15px ${cardAccent}40`,
                    }}
                  >
                    Limited
                  </div>
                )}



                {stockStatus === 'low-stock' && (
                  <div className="px-3 py-1.5 rounded-lg bg-orange-500/20 backdrop-blur-md flex items-center gap-1">
                    <Zap className="w-3 h-3 text-orange-400" />
                    <span className="text-[9px] text-orange-400 font-medium">
                      Low Stock
                    </span>
                  </div>
                )}

                {stockStatus === 'out-of-stock' && (
                  <div className="px-3 py-1.5 rounded-lg bg-red-500/20 backdrop-blur-md">
                    <span className="text-[9px] text-red-400 font-medium">
                      Sold Out
                    </span>
                  </div>
                )}
              </div>

              {/* Verified Badge (Top Right - Seller Verification) */}
              {isSellerVerified && (
                <div className="absolute top-4 right-4 bg-[#8451E1] text-white rounded-full p-1.5 shadow-lg hover:shadow-xl transition-shadow">
                  <CheckCircle className="w-5 h-5" />
                </div>
              )}

              {/* Quick Actions */}
              {stockStatus !== 'out-of-stock' && (
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {showQuickView && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setShowQuickPreview(true);
                      }}
                      className="p-2.5 bg-white/90 hover:bg-white text-black rounded-full backdrop-blur-md transition-all transform hover:scale-110 active:scale-95"
                      title="Quick view"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}

                  {showWishlist && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsWishlisted(!isWishlisted);
                        toastSvc.success(
                          isWishlisted
                            ? 'Removed from wishlist'
                            : 'Added to wishlist'
                        );
                      }}
                      className={`p-2.5 backdrop-blur-md rounded-full transition-all transform hover:scale-110 active:scale-95 ${
                        isWishlisted
                          ? 'bg-red-500/90 text-white'
                          : 'bg-white/90 hover:bg-white text-black'
                      }`}
                      title="Add to wishlist"
                    >
                      <Heart
                        className="w-4 h-4"
                        fill={isWishlisted ? 'currentColor' : 'none'}
                      />
                    </button>
                  )}

                  {showShare && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigator.share({
                          title: product.title,
                          text: product.description || product.title,
                          url: window.location.href,
                        });
                      }}
                      className="p-2.5 bg-white/90 hover:bg-white text-black rounded-full backdrop-blur-md transition-all transform hover:scale-110 active:scale-95"
                      title="Share product"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="pt-4 px-4 pb-4 bg-black flex flex-col flex-1">
              {/* Category & Brand Row */}
              <div className="flex items-center justify-between mb-2 gap-2">
                {product.category && (
                  <span
                    className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-full text-white truncate"
                    style={{
                      backgroundColor: cardAccent + '20',
                      color: cardAccent,
                      border: `1px solid ${cardAccent}40`,
                    }}
                  >
                    {product.category}
                  </span>
                )}
              </div>

              <p className="text-[#acacac] text-[10px] font-medium uppercase tracking-wider mb-2 truncate">
                {business?.brand_name || 'Luxela'}
              </p>

              {/* Title */}
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-[#f2f2f2] capitalize font-semibold text-sm line-clamp-2 leading-snug flex-1">
                  {product.title}
                </h3>
                {isSellerVerified && (
                  <CheckCircle className="w-4 h-4 text-[#8451E1] flex-shrink-0" />
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-[#acacac] text-[11px] line-clamp-1 mb-2">
                  {product.description.substring(0, 80)}
                  {product.description.length > 80 ? '...' : ''}
                </p>
              )}

              {/* Colors & Rating Row */}
              <div className="flex items-center justify-between mb-3 gap-2">
                {colors && colors.length > 0 && (
                  <div className="flex items-center -space-x-1">
                    {colors.slice(0, 3).map((color, i) => {
                      const name = color.colorName?.toLowerCase().trim() || '';
                      const hexFromDb = color.colorHex?.startsWith('#')
                        ? color.colorHex
                        : null;
                      const hexFromMap = UI_COLOR_MAP[name];
                      const finalColor = hexFromDb || hexFromMap;

                      return (
                        <div
                          key={`${product.id}-${i}`}
                          title={color.colorName}
                          className={`flex items-center justify-center rounded-full border-2 shadow-sm transition-transform hover:z-10 hover:scale-125 ${
                            finalColor ? 'w-3.5 h-3.5' : 'w-4 h-4 bg-zinc-800'
                          }`}
                          style={{
                            backgroundColor: finalColor || undefined,
                            borderColor: cardAccent + '60',
                          }}
                        >
                          {!finalColor && (
                            <span className="text-[7px] text-white font-bold uppercase">
                              {name.charAt(0)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {colors.length > 3 && (
                      <span className="text-[8px] text-gray-500 pl-1">
                        +{colors.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {product.rating && product.rating > 0 && (
                  <div className="flex items-center gap-1 ml-auto">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.round(product.rating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[9px] text-[#acacac]">
                      ({product.review_count || 0})
                    </span>
                  </div>
                )}
              </div>

              {/* Price & Sales */}
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <div>
                  <span className="text-[#8451E1] font-bold text-sm">
                    {product.currency}{' '}
                    {((product.price_cents || 0) / 100).toLocaleString()}
                  </span>
                </div>

                {product.sales_count && product.sales_count > 0 && (
                  <span className="text-[9px] text-[#acacac] flex items-center gap-1">
                    <Zap className="w-3 h-3 text-orange-500" />
                    {product.sales_count} sold
                  </span>
                )}
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleQuickAdd}
                disabled={isAdding || stockStatus === 'out-of-stock'}
                className={`
                  w-full relative flex cursor-pointer items-center justify-center p-2.5 rounded-lg transition-all duration-300 font-medium text-sm
                  ${
                    added
                      ? 'bg-green-500 scale-105'
                      : 'hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
                  }
                `}
                style={{
                  background: added
                    ? undefined
                    : `linear-gradient(180deg, #8451E1 0%, #5C2EAF 100%)`,
                  boxShadow: added
                    ? undefined
                    : `0 0 15px ${cardAccent}40, inset 0 0 10px ${cardAccent}20`,
                }}
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : added ? (
                  <Check className="w-4 h-4 text-white animate-in zoom-in" />
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 text-white mr-2" />
                    <span className="text-white">Add to Cart</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Link>
      </div>

      {/* Auth Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="bg-[#141414] border-[#212121] text-white sm:max-w-md rounded-2xl">
          <DialogHeader className="flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
              <LogIn className="w-6 h-6 text-purple-500" />
            </div>
            <DialogTitle className="text-lg font-medium">
              Sign in Required
            </DialogTitle>
            <DialogDescription className="text-[#ACACAC] text-center pt-2">
              To add{' '}
              <span className="text-white font-medium">{product.title}</span> to
              your cart, please sign in.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={() =>
                router.push(`/signin?redirect=/buyer/product/${product.id}`)
              }
              className="w-full text-white h-12 font-medium py-3 rounded-xl transition-all"
            >
              Sign In to Continue
            </Button>
            <button
              onClick={() => setShowAuthModal(false)}
              className="w-full bg-transparent hover:bg-white/5 text-[#ACACAC] font-medium py-3 rounded-xl transition-all"
            >
              Maybe Later
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Preview Modal */}
      <Dialog open={showQuickPreview} onOpenChange={setShowQuickPreview}>
        <DialogContent className="bg-[#141414] border-[#212121] text-white sm:max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {product.title}
            </DialogTitle>
            <DialogDescription className="text-[#ACACAC]">
              {product.sellers?.seller_business?.[0]?.brand_name || 'Luxela'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6 mt-4">
            {/* Image with Carousel */}
            <div className="bg-[#222] rounded-lg overflow-hidden">
              {isValidImage && images.length > 0 ? (
                <HorizontalImageScroller
                  images={images}
                  alt={product.title}
                  showThumbnails={true}
                  showDots={true}
                  autoScroll={false}
                  className="h-96"
                />
              ) : (
                <div className="w-full h-96 flex items-center justify-center">
                  <Images className="w-16 h-16 text-gray-700" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#acacac] mb-2">Price</p>
                <p className="text-2xl font-bold text-[#8451E1]">
                  {product.currency}{' '}
                  {((product.price_cents || 0) / 100).toLocaleString()}
                </p>
              </div>

              {product.description && (
                <div>
                  <p className="text-sm text-[#acacac] mb-2">Description</p>
                  <p className="text-sm text-[#dcdcdc]">{product.description}</p>
                </div>
              )}

              {colors && colors.length > 0 && (
                <div>
                  <p className="text-sm text-[#acacac] mb-2">Available Colors</p>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color, i) => {
                      const name = color.colorName?.toLowerCase().trim() || '';
                      const hexFromDb = color.colorHex?.startsWith('#')
                        ? color.colorHex
                        : null;
                      const hexFromMap = UI_COLOR_MAP[name];
                      const finalColor = hexFromDb || hexFromMap;

                      return (
                        <button
                          key={i}
                          className="px-3 py-1.5 rounded-lg border border-[#333] hover:border-[#8451E1] transition-colors text-xs"
                          style={{
                            backgroundColor: finalColor + '20',
                            color: finalColor || '#dcdcdc',
                            borderColor: finalColor + '60',
                          }}
                        >
                          {color.colorName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-[#acacac] mb-2">Stock Status</p>
                <p
                  className="text-sm font-medium"
                  style={{
                    color:
                      stockStatus === 'in-stock'
                        ? '#22c55e'
                        : stockStatus === 'low-stock'
                          ? '#f97316'
                          : '#ef4444',
                  }}
                >
                  {stockStatus === 'in-stock'
                    ? `${product.quantity_available} In Stock`
                    : stockStatus === 'low-stock'
                      ? `Only ${product.quantity_available} Left`
                      : 'Out of Stock'}
                </p>
              </div>

              <Button
                onClick={(e) => {
                  handleQuickAdd(e as any);
                  setShowQuickPreview(false);
                }}
                disabled={isAdding || stockStatus === 'out-of-stock'}
                className="w-full text-white h-12 font-medium py-3 rounded-xl transition-all bg-gradient-to-r from-[#8451E1] to-[#5C2EAF]"
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
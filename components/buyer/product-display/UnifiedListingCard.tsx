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
import { addToFavorites, removeFromFavorites } from '@/server/actions/favorites';
import { useListings } from '@/context/ListingsContext';
import { formatCurrency } from '@/lib/utils';
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
import {
  PREMIUM_COLORS,
  CARD_DIMENSIONS,
  getCardBorderColor,
  getCardShadow,
  getCardHoverShadow,
} from './UnifiedCardConfig';

// Unified color map for display
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

interface UnifiedListingCardProps {
  listing: Listing;
  showWishlist?: boolean;
  showQuickView?: boolean;
  showShare?: boolean;
  variant?: 'product' | 'collection' | 'brand';
}

/**
 * UNIFIED LISTING CARD
 * 
 * Single component used across:
 * - Product Listings (home, browse)
 * - Collection Products
 * - Brand Products
 * 
 * Features:
 * - Consistent: 280px height (image) + 180px (content) = 460px total
 * - Unified grid: 3 columns on desktop, 3 on tablet, 2 on mobile
 * - Premium borders: 5-color rotation (#ECBEE3, #EA795B, #ECE3BE, #BEECE3, #BEE3EC)
 * - Same interaction patterns
 * - Responsive and accessible
 */
export default function UnifiedListingCard({
  listing,
  showWishlist = true,
  showQuickView = true,
  showShare = true,
  variant = 'product',
}: UnifiedListingCardProps) {
  const { addToCart } = useCartState();
  const { user } = useAuth();
  const router = useRouter();
  const { isListingApproved, validateProductForCart } = useListings();

  const isApproved = isListingApproved(listing.id);

  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [showQuickPreview, setShowQuickPreview] = useState(false);

  const business = listing.sellers?.seller_business?.[0];
  const isSellerVerified = listing.is_verified || false;

  // Deterministic color assignment based on listing ID
  const borderColor = getCardBorderColor(listing.id);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isApproved) {
      toastSvc.error('This product is not currently available.');
      return;
    }

    const validation = validateProductForCart(listing.id);
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
      await addToCart(listing.id, 1);
      setAdded(true);
      const priceInNGN = listing.price_cents ? (listing.price_cents / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }) : 'Price unavailable';
      toastSvc.success(`✓ ${listing.title} added to cart • ${priceInNGN}`);
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

  // Parse images from imagesJson first, then fall back to image field
  const images = useMemo(() => {
    const imageArray: string[] = [];
    
    // Try to parse imagesJson first - contains all product images
    if (listing.imagesJson) {
      try {
        const parsed = JSON.parse(listing.imagesJson);
        if (Array.isArray(parsed)) {
          // Array of URLs or objects
          parsed.forEach((item: any) => {
            if (typeof item === 'string' && item.trim().length > 0) {
              imageArray.push(item);
            } else if (item?.imageUrl && typeof item.imageUrl === 'string') {
              imageArray.push(item.imageUrl);
            } else if (item?.url && typeof item.url === 'string') {
              imageArray.push(item.url);
            }
          });
        } else if (typeof parsed === 'string' && parsed.trim().length > 0) {
          imageArray.push(parsed);
        }
      } catch (e) {
        console.warn('[UnifiedListingCard] Failed to parse imagesJson for listing:', listing.id, e);
      }
    }
    
    // Fallback to image field
    if (imageArray.length === 0 && listing.image && listing.image.length > 0) {
      imageArray.push(listing.image);
    }
    
    if (imageArray.length > 1) {
      console.log(`[UnifiedListingCard] Listing "${listing.title}" - Parsed ${imageArray.length} images from imagesJson`);
    }
    
    return imageArray.length > 0 ? imageArray : [];
  }, [listing.imagesJson, listing.image]);


  const isValidImage =
    images &&
    images.length > 0 &&
    images[0] &&
    typeof images[0] === 'string' &&
    images[0].length > 0 &&
    !images[0].includes('placeholder.com') &&
    images[0] !== LUXELA_PLACEHOLDER;

  const colors = useMemo(() => {
    // Handle both formats - colors (from product endpoint) and colors_available (from collections)
    const colorsData = listing.colors || listing.colors_available;
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
  }, [listing.colors, listing.colors_available]);

  const stockStatus =
    listing.quantity_available === 0
      ? 'out-of-stock'
      : listing.quantity_available <= 5
        ? 'low-stock'
        : 'in-stock';

  const destinationUrl =
    variant === 'collection'
      ? `/buyer/collection/${listing.id}`
      : `/buyer/product/${listing.id}`;

  return (
    <>
      <div className="group relative h-full flex flex-col">
        <Link href={destinationUrl} className="block flex-1 pointer-events-none">
          <div
            className="relative h-full bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-xl overflow-hidden transition-all duration-300 shadow-lg border-2 flex flex-col"
            style={{
              borderColor: borderColor + '40',
              boxShadow: `0 4px 20px ${borderColor}10`,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = borderColor + '80';
              el.style.boxShadow = `0 8px 40px ${borderColor}30`;
              el.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = borderColor + '40';
              el.style.boxShadow = `0 4px 20px ${borderColor}10`;
              el.style.transform = 'translateY(0)';
            }}
          >
            {/* Image Section - Responsive height with aspect ratio */}
            <div className="relative w-full bg-[#222] overflow-hidden flex-shrink-0 pointer-events-auto" style={{ aspectRatio: '1 / 1', height: 'auto', touchAction: 'pan-y' }}>
              {isValidImage && images.length > 0 ? (
                <HorizontalImageScroller
                  images={images}
                  alt={listing.title}
                  showThumbnails={images.length > 1}
                  showDots={true}
                  autoScroll={false}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
                  <Images className="w-12 h-12 text-gray-700" />
                </div>
              )}

              {/* Badges Section */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {/* Approval Badge */}
                <ApprovalBadge isApproved={isApproved} showText={false} />

                {listing.limited_edition_badge === 'show_badge' && (
                  <div
                    className="px-3 py-1.5 rounded-lg font-medium uppercase text-white text-xs backdrop-blur-md"
                    style={{
                      backgroundColor: borderColor,
                      boxShadow: `0 0 15px ${borderColor}40`,
                    }}
                  >
                    Limited
                  </div>
                )}

                {listing.is_verified && (
                  <div className="px-3 py-1.5 rounded-lg bg-green-500/20 backdrop-blur-md flex items-center gap-1">
                    <Shield className="w-3 h-3 text-green-400" />
                    <span className="text-[9px] text-green-400 font-medium">
                      Verified
                    </span>
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

              {/* Verified Badge (Top Right - Like Brands) */}
              {isSellerVerified && (
                <div className="absolute top-4 right-4 bg-[#8451E1] text-white rounded-full p-1 shadow-lg">
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
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!user) {
                          setShowAuthModal(true);
                          return;
                        }
                        try {
                          setWishlistLoading(true);
                          if (isWishlisted) {
                            const result = await removeFromFavorites(listing.id);
                            if (result.success) {
                              setIsWishlisted(false);
                              toastSvc.success('Removed from wishlist');
                            } else {
                              toastSvc.error(result.error || 'Failed to remove from favorites');
                            }
                          } else {
                            const result = await addToFavorites(listing.id);
                            if (result.success) {
                              setIsWishlisted(true);
                              toastSvc.success('Added to wishlist');
                            } else {
                              toastSvc.error(result.error || 'Failed to add to favorites');
                            }
                          }
                        } catch (error) {
                          console.error('Error toggling wishlist:', error);
                          toastSvc.error('Failed to update wishlist');
                        } finally {
                          setWishlistLoading(false);
                        }
                      }}
                      disabled={wishlistLoading}
                      className={`p-2.5 backdrop-blur-md rounded-full transition-all transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
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
                          title: listing.title,
                          text: listing.description || listing.title,
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

            {/* Content Section - Flexible, fills remaining space (min 180px) */}
            <div className="p-4 bg-black flex flex-col flex-1 justify-between min-h-[180px]">
              {/* Top Section */}
              <div>
                {/* Category & Brand Row */}
                <div className="flex items-center justify-between mb-2 gap-2">
                  {listing.category && (
                    <span
                      className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-full text-white truncate"
                      style={{
                        backgroundColor: borderColor + '20',
                        color: borderColor,
                        border: `1px solid ${borderColor}40`,
                      }}
                    >
                      {listing.category}
                    </span>
                  )}
                </div>

                <p className="text-[#acacac] text-[10px] font-medium uppercase tracking-wider mb-2 truncate">
                  {business?.brand_name || 'Luxela'}
                </p>

                {/* Title */}
                <h3 className="text-[#f2f2f2] capitalize font-semibold text-sm line-clamp-2 leading-snug h-9 mb-2">
                  {listing.title}
                </h3>

                {/* Description */}
                {listing.description && (
                  <p className="text-[#acacac] text-[11px] line-clamp-1 mb-3">
                    {listing.description.substring(0, 60)}
                    {listing.description.length > 60 ? '...' : ''}
                  </p>
                )}
              </div>

              {/* Bottom Section */}
              <div className="space-y-3">
                {/* Stock Quantity Display */}
                {listing.quantity_available !== undefined && (
                  <div className="flex items-center justify-between text-[10px] text-[#999] mb-2 pb-2 border-b border-[#333]">
                    <span className="font-semibold">Stock:</span>
                    <span className={`font-bold ${
                      listing.quantity_available === 0 ? 'text-red-400' : 
                      listing.quantity_available <= 5 ? 'text-orange-400' : 
                      'text-green-400'
                    }`}>
                      {listing.quantity_available} items
                    </span>
                  </div>
                )}

                {/* Colors & Rating Row */}
                <div className="flex items-center justify-between gap-2">
                  {colors.length > 0 && (
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
                            key={`${listing.id}-${i}`}
                            title={color.colorName}
                            className={`flex items-center justify-center rounded-full border-2 shadow-sm transition-transform hover:z-10 hover:scale-125 ${
                              finalColor ? 'w-3.5 h-3.5' : 'w-4 h-4 bg-zinc-800'
                            }`}
                            style={{
                              backgroundColor: finalColor || undefined,
                              borderColor: borderColor + '60',
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

                  {listing.rating && listing.rating > 0 && (
                    <div className="flex items-center gap-1 ml-auto">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.round(listing.rating || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] text-[#acacac]">
                        ({listing.review_count || 0})
                      </span>
                    </div>
                  )}
                </div>

                {/* Seller Info */}
                {business && (
                  <div className="flex items-center justify-between text-[10px] mb-2">
                    <span className="text-[#999]">Seller:</span>
                    <span className="text-[#8451E1] font-semibold truncate max-w-[80px]" title={business.brand_name}>
                      {business.brand_name}
                    </span>
                  </div>
                )}

                {/* Product ID & Creation Date */}
                <div className="text-[9px] text-[#666] mb-3 pb-2 border-b border-[#222] space-y-1">
                  <div className="flex justify-between">
                    <span>ID:</span>
                    <span className="font-mono truncate max-w-[90px]" title={listing.id}>{listing.id.slice(0, 8)}...</span>
                  </div>
                  {listing.created_at && (
                    <div className="flex justify-between">
                      <span>Added:</span>
                      <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Price & Sales */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <span className="text-[#8451E1] font-bold text-sm">
                      {formatCurrency((listing.price_cents || 0) / 100, { currency: listing.currency || 'NGN', truncate: true })}
                    </span>
                  </div>

                  {listing.sales_count && listing.sales_count > 0 && (
                    <span className="text-[9px] text-[#acacac] flex items-center gap-1">
                      <Zap className="w-3 h-3 text-orange-500" />
                      {listing.sales_count} sold
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
                      : `0 0 15px ${borderColor}40, inset 0 0 10px ${borderColor}20`,
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
              <span className="text-white font-medium">{listing.title}</span> to
              your cart, please sign in.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={() =>
                router.push(`/signin?redirect=/buyer/product/${listing.id}`)
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
        <DialogContent className="bg-[#141414] border-[#212121] text-white w-[95vw] sm:w-full sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {listing.title}
            </DialogTitle>
            <DialogDescription className="text-[#ACACAC]">
              {listing.sellers?.seller_business?.[0]?.brand_name || 'Luxela'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4 px-2 sm:px-0">
            {/* Image - Fixed Height */}
            <div className="bg-[#222] rounded-lg overflow-hidden w-full">
              {isValidImage ? (
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-64 sm:h-96 object-cover"
                />
              ) : (
                <div className="w-full h-64 sm:h-96 flex items-center justify-center">
                  <Images className="w-16 h-16 text-gray-700" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-sm text-[#acacac] mb-2">Price</p>
                <p className="text-2xl font-bold text-[#8451E1]">
                  {formatCurrency((listing.price_cents || 0) / 100, { currency: listing.currency || 'NGN', truncate: true })}
                </p>
              </div>

              {listing.description && (
                <div>
                  <p className="text-sm text-[#acacac] mb-2">Description</p>
                  <p className="text-sm text-[#dcdcdc]">{listing.description}</p>
                </div>
              )}

              {colors.length > 0 && (
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
                    ? `${listing.quantity_available} In Stock`
                    : stockStatus === 'low-stock'
                      ? `Only ${listing.quantity_available} Left`
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
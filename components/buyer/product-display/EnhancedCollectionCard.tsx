'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Listing } from '@/types/listing';
import { ArrowRight, Grid, Star, CheckCircle } from 'lucide-react';
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

interface EnhancedCollectionCardProps {
  collection: any;
  variant?: 'featured' | 'grid' | 'hero';
}

export default function EnhancedCollectionCard({
  collection,
  variant = 'grid',
}: EnhancedCollectionCardProps) {
  const [imageIndex, setImageIndex] = useState(0);

  // Handle both collection.items (from trpc) and collection.items_json (legacy)
  let collectionItems: Listing[] = [];
  let productCount = 0;

  // First priority: items array from backend (from trpc getApprovedCollections)
  if (Array.isArray(collection.items) && collection.items.length > 0) {
    collectionItems = collection.items;
    productCount = collectionItems.length;
  }
  // Second priority: collectionItemCount directly
  else if (typeof collection.collectionItemCount === 'number' && collection.collectionItemCount > 0) {
    productCount = collection.collectionItemCount;
  }
  // Third priority: itemCount for backward compatibility
  else if (typeof collection.itemCount === 'number' && collection.itemCount > 0) {
    productCount = collection.itemCount;
  }
  // Fallback to items_json
  else if (collection.items_json) {
    try {
      collectionItems = JSON.parse(collection.items_json);
      productCount = collectionItems.length;
    } catch (e) {
      console.error('Error parsing items_json:', e);
      productCount = 0;
    }
  }
  // Final fallback to itemsJson
  else if (collection.itemsJson) {
    try {
      collectionItems = JSON.parse(collection.itemsJson);
      productCount = collectionItems.length;
    } catch (e) {
      console.error('Error parsing itemsJson:', e);
      productCount = 0;
    }
  }

  const brand = collection.sellers?.seller_business?.[0] || collection.sellerName;
  const avgRating =
    productCount > 0
      ? (
          collectionItems.reduce((sum, item) => sum + (item.rating || 0), 0) /
          productCount
        ).toFixed(1)
      : 0;

  // Extract the first image from collection
  const collectionImage = useMemo(() => {
    console.log('[EnhancedCollectionCard] Getting image for collection:', {
      id: collection.id,
      title: collection.title,
      type: collection.type,
      hasImagesJson: !!collection.imagesJson,
      imagesJsonLength: collection.imagesJson ? collection.imagesJson.length : 0,
      hasImage: !!collection.image,
      hasCollectionProducts: !!collection.collectionProducts,
      collectionProductsLength: collection.collectionProducts?.length || 0,
    });
    
    // First priority: parse imagesJson array
    if (collection.imagesJson) {
      try {
        const images = typeof collection.imagesJson === 'string' 
          ? JSON.parse(collection.imagesJson)
          : collection.imagesJson;
        console.log('[EnhancedCollectionCard] Parsed images:', images);
        if (Array.isArray(images) && images.length > 0) {
          console.log('[EnhancedCollectionCard] Using first image from imagesJson:', images[0]);
          return images[0];
        }
      } catch (e) {
        console.warn('Error parsing imagesJson:', e, collection.imagesJson);
      }
    }
    // Second priority: collection.image field
    if (collection.image) {
      console.log('[EnhancedCollectionCard] Using collection.image:', collection.image);
      return collection.image;
    }
    // Third priority: first product image from collectionProducts
    if (collection.collectionProducts && collection.collectionProducts.length > 0) {
      const firstProduct = collection.collectionProducts[0];
      if (firstProduct.images && firstProduct.images.length > 0) {
        console.log('[EnhancedCollectionCard] Using first product image:', firstProduct.images[0]);
        return firstProduct.images[0];
      }
    }
    // Fallback to placeholder
    console.log('[EnhancedCollectionCard] Using placeholder image');
    return '/images/baz1.svg';
  }, [collection]);

  // Extract unique colors from collection items
  const collectionColors = useMemo(() => {
    const colorSet = new Map<string, { colorName: string; colorHex: string }>();
    console.log('[EnhancedCollectionCard] Collection data:', { collection, collectionItems: collectionItems.length });
    console.log('[EnhancedCollectionCard] Extracting colors from items:', collectionItems);
    collectionItems.forEach((item: any, idx: number) => {
      console.log(`[EnhancedCollectionCard] Item ${idx}:`, { 
        title: item.title, 
        colorsAvailable: item.colorsAvailable,
        colors_available: item.colors_available,
        colors: item.colors,
        listingColorsAvailable: item.listingColorsAvailable,
        allKeys: Object.keys(item)
      });
      try {
        // Try multiple possible field names
        const colorsSource = item.colorsAvailable || item.colors_available || item.colors || item.listingColorsAvailable;
        console.log(`[EnhancedCollectionCard] Item ${idx} colorsSource:`, colorsSource);
        if (!colorsSource) return;
        
        // Parse if it's a string (JSON)
        let colors = colorsSource;
        if (typeof colorsSource === 'string') {
          try {
            colors = JSON.parse(colorsSource);
          } catch (e) {
            // If JSON parsing fails, treat it as a plain string color name
            colors = [{ colorName: colorsSource, colorHex: '#cccccc' }];
          }
        }
        
        // Handle array of colors
        if (Array.isArray(colors)) {
          colors.forEach((color: any) => {
            // Handle both object format {colorName, colorHex} and string format
            if (typeof color === 'string') {
              // Simple string color name
              if (!colorSet.has(color)) {
                colorSet.set(color, { colorName: color, colorHex: '#cccccc' });
              }
            } else if (color && (color.colorHex || color.hex)) {
              const hex = color.colorHex || color.hex;
              const name = color.colorName || color.name || hex;
              if (!colorSet.has(hex)) {
                colorSet.set(hex, { colorName: name, colorHex: hex });
              }
            }
          });
        }
      } catch (e) {
        console.warn('Error extracting colors from item:', e);
        // Skip colors that can't be parsed
      }
    });
    const extractedColors = Array.from(colorSet.values()).slice(0, 5);
    console.log('[EnhancedCollectionCard] Extracted colors:', extractedColors);
    return extractedColors;
  }, [collectionItems]);

  // Calculate total price from collection
  const totalPriceCents = collection.totalPriceCents || collection.totalPrice || 0;
  const totalPrice = totalPriceCents / 100; // Convert from cents to decimal
  const formattedPrice = totalPrice > 0 ? `NGN ${totalPrice.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Price pending';

  const getBadgeText = (collection: any) => {
    if (collection.limited_edition_badge === 'show_badge')
      return 'Limited Edition';
    const createdDate = new Date(collection.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (createdDate > weekAgo) return 'New Drop';
    return 'Featured';
  };

  if (variant === 'hero') {
    return (
      <Link href={`/buyer/collection/${collection.id}`} className="block group">
        <div className="relative aspect-video md:aspect-auto md:h-96 rounded-2xl overflow-hidden">
          {/* Background Image */}
          <img
            src={collectionImage}
            alt={collection.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
            <div className="mb-4">
              <span
                className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md"
                style={{
                  backgroundColor: '#8451E1',
                  boxShadow: '0 0 20px #8451E140',
                }}
              >
                {getBadgeText(collection)}
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 capitalize">
              {collection.title}
            </h2>

            {collection.description && (
              <p className="text-base text-[#dcdcdc] mb-4 line-clamp-2">
                {collection.description}
              </p>
            )}

            <div className="flex items-center gap-4">
              <p className="text-sm text-[#acacac]">
                <span className="font-semibold text-white">{productCount}</span>{' '}
                Products
              </p>
              <p className="text-sm text-[#acacac]">
                by{' '}
                <span className="font-semibold text-white">
                  {brand?.brand_name || 'Featured Brand'}
                </span>
              </p>
            </div>

            <Button className="mt-6 w-full md:w-auto text-white py-3 px-8 font-medium flex items-center gap-2 bg-gradient-to-r from-[#8451E1] to-[#5C2EAF] hover:shadow-lg hover:shadow-[#8451E1]/50 transition-all transform group-hover:translate-x-1">
              Explore Collection
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/buyer/collection/${collection.id}`} className="block group">
      <div className="relative rounded-xl overflow-hidden transition-all duration-300 h-full flex flex-col border border-purple-900/30 hover:border-purple-900/60 shadow-lg shadow-black/50 hover:shadow-purple-900/30 bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a]">
        {/* Image Section */}
        <div className="relative w-full bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] overflow-hidden flex-shrink-0 mb-4 h-56 sm:h-64 md:h-56 lg:h-60">
          <img
            src={collectionImage}
            alt={collection.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-purple-900/10 group-hover:from-black/70 group-hover:via-black/30 group-hover:to-purple-900/20 transition-all duration-300" />

          {/* Badge */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 backdrop-blur-md shadow-lg shadow-purple-900/50 border border-purple-400/30">
              <span className="text-white text-xs font-bold uppercase tracking-wide">
                {getBadgeText(collection)}
              </span>
            </div>
            
            {/* Verified Badge */}
            {collection.status === 'approved' && (
              <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 backdrop-blur-md flex items-center gap-1 shadow-lg shadow-purple-900/50 border border-purple-400/30">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-xs font-bold">Verified</span>
              </div>
            )}

            {/* Pending Review Badge */}
            {collection.status === 'pending_review' && (
              <div className="px-3 py-1.5 rounded-lg bg-yellow-500/20 backdrop-blur-md flex items-center gap-1 shadow-lg shadow-yellow-900/50 border border-yellow-400/30">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-yellow-400 text-xs font-bold">Pending</span>
              </div>
            )}
          </div>

          {/* Product Count Overlay */}
          <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-gradient-to-r from-black/80 to-purple-900/40 backdrop-blur-md flex items-center gap-1 border border-purple-900/40 shadow-lg shadow-black/50">
            <Grid className="w-3 h-3 text-purple-400" />
            <span className="text-white text-xs font-medium">
              {productCount} items
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col flex-1 p-4">
          {/* Brand Name */}
          <p className="text-purple-400/70 text-[10px] font-bold uppercase tracking-wider mb-2">
            {brand?.brand_name || 'Featured Brand'}
          </p>

          {/* Title */}
          <h3 className="text-white capitalize font-bold text-sm line-clamp-2 leading-snug h-9 mb-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent group-hover:from-purple-300 group-hover:to-pink-300 transition-all">
            {collection.title}
          </h3>

          {/* Description */}
          {collection.description && (
            <p className="text-purple-300/60 text-[11px] line-clamp-1 mb-3">
              {collection.description}
            </p>
          )}

          {/* Color Swatches */}
          {collectionColors.length > 0 && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/20">
              <div className="flex items-center -space-x-1">
                {collectionColors.slice(0, 4).map((color: any, i: number) => {
                  const name = color.colorName?.toLowerCase().trim() || '';
                  const hexFromDb = color.colorHex?.startsWith('#')
                    ? color.colorHex
                    : null;
                  const hexFromMap = UI_COLOR_MAP[name];
                  const finalColor = hexFromDb || hexFromMap;

                  return (
                    <div
                      key={`${i}-${color.colorHex}`}
                      title={color.colorName}
                      className={`flex items-center justify-center rounded-full border-2 shadow-sm transition-transform hover:z-10 hover:scale-125 ${
                        finalColor ? 'w-4 h-4' : 'w-5 h-5 bg-zinc-800'
                      }`}
                      style={{
                        backgroundColor: finalColor || undefined,
                        borderColor: '#8451E160',
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
                {collectionColors.length > 4 && (
                  <span className="text-[8px] text-gray-500 pl-1.5 flex items-center">
                    +{collectionColors.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Price Display */}
          {totalPrice > 0 && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/40">
              <p className="text-purple-300/70 text-[10px] uppercase tracking-wide mb-1">Total Collection</p>
              <p className="text-white font-bold text-sm">{formattedPrice}</p>
            </div>
          )}

          {/* Stats Row */}
          <div className="flex items-center justify-between gap-2 mb-3 text-[11px] px-3 py-2 rounded-lg bg-purple-900/15 border border-purple-900/20">
            <div className="flex items-center gap-1">
              <span className="text-purple-300/70">{productCount} items</span>
            </div>

            {productCount > 0 && (
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-2.5 h-2.5 ${
                        i < Math.round(parseFloat(avgRating as string))
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-700'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-purple-300/70">({avgRating})</span>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <Button className="w-full text-white py-2 px-3 font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all hover:shadow-lg hover:shadow-purple-900/60 active:scale-95 mt-auto border border-purple-400/30 shadow-lg shadow-purple-900/30">
            View Collection
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
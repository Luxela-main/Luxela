'use client';

import { useEffect, useState, useCallback } from 'react';
import { trpc } from '@/app/_trpc/client';

export interface Collection {
  id: string;
  listingId: string;
  title: string;
  name?: string;
  description: string | null;
  slug: string | null;
  image: string | null;
  images: string[];
  imagesJson?: string | null;
  priceCents: number | null;
  price: number | null;
  category: string | null;
  brandId: string;
  brandName?: string;
  createdAt: string;
  updatedAt: string;
  sku?: string | null;
  metaDescription?: string | null;
  barcode?: string | null;
  videoUrl?: string | null;
  careInstructions?: string | null;
  brandLogo?: string | null;
  brandHeroImage?: string | null;
  sellerName?: string;
  sellerId?: string;
  status: string;
  type: 'collection' | 'single';
  collectionId?: string | null;
  collectionItemCount?: number;
  collectionTotalPrice?: number;
  totalPrice?: number;
  totalPriceCents?: number;
  avgPrice?: number;
  shippingOption?: string | null;
  refundPolicy?: string | null;
  quantityAvailable?: number | null;
  items?: any[];
  itemsJson?: string | null;
  colors?: string[];
}

export interface UseCollectionsOptions {
  limit?: number;
  search?: string;
  category?: string;
}

export interface UseCollectionsResult {
  data: Collection[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Collections hook with built-in retry, caching, and error recovery
 * Handles network errors gracefully with exponential backoff
 */
export function useCollections({
  limit = 20,
  search,
  category,
}: UseCollectionsOptions = {}): UseCollectionsResult {
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const [cachedData, setCachedData] = useState<Collection[] | null>(null);
  const [data, setData] = useState<Collection[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Use tRPC query with manual retry control
  const { data: tRPCData, isLoading, error: tRPCError, refetch } = trpc.collection.getApprovedCollections.useQuery(
    {
      limit: limit || 20,
      offset: 0,
    },
    {
      enabled: true,
      retry: false,
    }
  );

  // Process tRPC data
  useEffect(() => {
    console.log('[useCollections] Raw tRPC data:', tRPCData);
    if (!tRPCData || !tRPCData.collections) {
      setData([]);
      return;
    }

    try {
      let collections: Collection[] = (tRPCData.collections || []).map((item: any) => {
        let images: string[] = [];
        if (item.imagesJson) {
          try {
            const parsed = JSON.parse(item.imagesJson);
            images = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            images = [];
          }
        }
        if (item.image && !images.includes(item.image)) {
          images.unshift(item.image);
        }

        const collectionColors = new Set<string>();
        if (item.items && Array.isArray(item.items)) {
          item.items.forEach((product: any) => {
            const colorsSource = product.colorsAvailable || product.colors_available || product.colors;
            if (colorsSource) {
              try {
                let colors = colorsSource;
                if (typeof colorsSource === 'string') {
                  try {
                    colors = JSON.parse(colorsSource);
                  } catch (e) {
                    colors = [colorsSource];
                  }
                }
                if (Array.isArray(colors)) {
                  colors.forEach((c: any) => {
                    const colorName = typeof c === 'string' ? c : (c.colorName || c.name || c);
                    collectionColors.add(colorName);
                  });
                }
              } catch (e) {
                // Color parsing failed
              }
            }
          });
        }

        const price = item.priceCents ? item.priceCents / 100 : null;
        const itemCount = item.itemCount || item.items?.length || 0;
        const totalPriceCents = item.totalPriceCents || item.totalPrice || 0;
        const totalPrice = totalPriceCents / 100;
        const avgPrice = item.avgPrice || (itemCount > 0 ? totalPriceCents / itemCount / 100 : 0);

        return {
          id: item.id,
          listingId: item.id,
          title: item.title,
          name: item.title,
          slug: item.slug,
          description: item.description,
          image: item.image,
          images: images,
          imagesJson: item.imagesJson,
          priceCents: item.priceCents,
          price: price,
          category: item.category,
          brandId: item.sellerId || '',
          brandName: item.sellerName,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          sku: undefined,
          metaDescription: undefined,
          barcode: undefined,
          videoUrl: undefined,
          careInstructions: undefined,
          brandLogo: undefined,
          brandHeroImage: undefined,
          sellerName: item.sellerName || 'Unknown Seller',
          sellerId: item.sellerId,
          status: 'approved',
          type: 'collection',
          collectionId: item.collectionId,
          collectionItemCount: itemCount,
          collectionTotalPrice: totalPrice,
          totalPrice: totalPrice,
          totalPriceCents: totalPriceCents,
          avgPrice: avgPrice,
          shippingOption: item.shippingOption,
          refundPolicy: item.refundPolicy,
          quantityAvailable: item.quantityAvailable,
          items: item.items || [],
          itemsJson: item.itemsJson,
          colors: Array.from(collectionColors),
        };
      });

      // Sort by latest first
      collections.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      // Apply search filter
      if (search && search.trim()) {
        const searchLower = search.toLowerCase();
        collections = collections.filter(
          (c) =>
            c.title.toLowerCase().includes(searchLower) ||
            c.description?.toLowerCase().includes(searchLower) ||
            c.brandName?.toLowerCase().includes(searchLower)
        );
      }

      setData(collections);
      setCachedData(collections);
      setRetryCount(0);
      setError(null);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to process collections';
      setError(errorMessage);
      console.error('Error processing collections:', errorMessage);
    }
  }, [tRPCData, search]);

  // Handle errors with retry and fallback
  useEffect(() => {
    if (tRPCError) {
      const errorMessage = tRPCError instanceof Error 
        ? tRPCError.message 
        : 'Failed to fetch collections';
      
      // Use cached data as fallback
      if (cachedData && cachedData.length > 0) {
        console.warn('[useCollections] Fetch failed, using cached data:', cachedData.length, 'items');
        setData(cachedData);
        setError(null);
        return;
      }
      
      // Retry with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`[useCollections] Retry ${retryCount + 1}/${MAX_RETRIES} in ${delay}ms`);
        const timer = setTimeout(() => {
          setRetryCount(retryCount + 1);
          refetch();
        }, delay);
        return () => clearTimeout(timer);
      }
      
      // All retries exhausted
      setError(errorMessage);
      console.error('[useCollections] Failed after retries:', errorMessage);
    }
  }, [tRPCError, retryCount, cachedData, refetch]);

  return {
    data: data.length > 0 ? data : (cachedData || []),
    isLoading: isLoading && data.length === 0,
    error: data.length > 0 ? null : error,
    refetch: async () => {
      setRetryCount(0);
      await refetch();
    },
  };
}

/**
 * Fetch detailed collection information with approved items
 */
export function useCollectionDetails(collectionId: string) {
  const { data: tRPCData, isLoading, error: tRPCError } = trpc.collection.getBuyerCollectionWithProducts.useQuery(
    { collectionId },
    {
      enabled: !!collectionId,
      retry: 2,
    }
  );

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Process the tRPC data
  useEffect(() => {
    if (!tRPCData) {
      setData(null);
      return;
    }

    try {
      const result = tRPCData;

      setData({
        collection: {
          id: result?.id,
          title: result?.name,
          description: result?.description,
          collectionId: result?.id,
        },
        items: result?.items || [],
        itemCount: result?.items?.length || 0,
      });
      setError(null);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to process collection details';
      setError(errorMessage);
      console.error('Error processing collection details:', errorMessage);
    }
  }, [tRPCData]);

  // Handle tRPC errors
  useEffect(() => {
    if (tRPCError) {
      const errorMessage = tRPCError instanceof Error 
        ? tRPCError.message 
        : 'Failed to fetch collection details';
      setError(errorMessage);
      console.error('tRPC Error fetching collection details:', errorMessage);
    }
  }, [tRPCError]);

  return {
    data,
    isLoading,
    error,
    refetch: () => Promise.resolve(),
  };
}
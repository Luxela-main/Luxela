'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { buyerPageCache, cacheKeys } from '@/utils/cache/buyer-page-cache';

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

interface UseCollectionsCachedResult {
  data: Collection[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isFromCache: boolean;
}

export function useCollectionsCached(options: {
  limit?: number;
  search?: string;
  category?: string;
} = {}): UseCollectionsCachedResult {
  const { limit = 20, search, category } = options;

  const [data, setData] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const isMountedRef = useRef(true);

  const fetchCollections = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const cacheParams = { limit, search, category };

      const cachedCollections = await buyerPageCache.getFromMemory<any>(
        cacheKeys.COLLECTIONS,
        cacheParams
      );

      if (cachedCollections && !search) {
        if (isMountedRef.current) {
          const collections = Array.isArray(cachedCollections.collections)
            ? cachedCollections.collections
            : cachedCollections;

          setData(collections);
          setIsLoading(false);
          setIsFromCache(true);
        }
        return;
      }

      const queryParams = new URLSearchParams();
      queryParams.set(
        'input',
        JSON.stringify({
          limit: limit || 20,
          offset: 0,
        })
      );

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(
        `/api/trpc/collection.getApprovedCollections?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      const result = await response.json();

      let collectionsData = result;
      if (Array.isArray(result) && result.length > 0) {
        collectionsData = result[0]?.result?.data || result[0];
      } else if (result?.result?.data) {
        collectionsData = result.result.data;
      }

      if (!response.ok || !collectionsData) {
        throw new Error('Failed to fetch collections');
      }

      let collections: Collection[] = (collectionsData.collections || []).map((item: any) => {
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
                    const colorName = typeof c === 'string' ? c : c.colorName || c.name || c;
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
          sellerName: item.sellerName || 'Unknown Seller',
          sellerId: item.sellerId,
          status: 'approved',
          type: 'collection' as const,
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

      collections.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      if (search && search.trim()) {
        const searchLower = search.toLowerCase();
        collections = collections.filter(
          (c) =>
            c.title.toLowerCase().includes(searchLower) ||
            c.description?.toLowerCase().includes(searchLower) ||
            c.brandName?.toLowerCase().includes(searchLower)
        );
      }

      const responseData = {
        collections: collections,
      };

      await buyerPageCache.set(cacheKeys.COLLECTIONS, responseData, cacheParams);

      if (isMountedRef.current) {
        setData(collections);
        setIsLoading(false);
        setIsFromCache(false);
      }
    } catch (err: any) {
      let errorMsg = 'Failed to fetch collections';

      if (err.name === 'AbortError') {
        errorMsg = 'Request timeout';
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }

      const localStorageCached = await buyerPageCache.getFromLocalStorage<any>(
        cacheKeys.COLLECTIONS,
        { limit, search, category }
      );

      if (localStorageCached && isMountedRef.current) {
        const collections = Array.isArray(localStorageCached.collections)
          ? localStorageCached.collections
          : localStorageCached;

        setData(collections);
        setError(null);
        setIsFromCache(true);
        setIsLoading(false);
        console.warn('[useCollectionsCached] Using stale localStorage cache as fallback');
      } else {
        if (isMountedRef.current) {
          setError(errorMsg);
          setIsLoading(false);
        }
        console.error('[useCollectionsCached] Error:', errorMsg);
      }
    }
  }, [limit, search, category]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchCollections();

    return () => {
      isMountedRef.current = false;
    };
  }, [limit, search, category, fetchCollections]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchCollections,
    isFromCache,
  };
}
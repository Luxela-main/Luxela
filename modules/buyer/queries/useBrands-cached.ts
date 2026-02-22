'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { buyerPageCache, cacheKeys, cacheTTL } from '@/utils/cache/buyer-page-cache';
import { Brand } from './useBrands';

interface UseBrandsCachedResult {
  brands: Brand[];
  isLoading: boolean;
  error: string | null;
  total: number;
  totalPages: number;
  refetch: () => Promise<unknown>;
  isFromCache: boolean;
}

export function useBrandsCached(options: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'followers' | 'products' | 'name' | 'rating';
} = {}): UseBrandsCachedResult {
  const { page = 1, limit = 20, search, sortBy = 'followers' } = options;

  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isFromCache, setIsFromCache] = useState(false);
  const isMountedRef = useRef(true);
  const cacheParamsRef = useRef({ page, limit, search, sortBy });

  const fetchBrands = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    setError(null);

    const MAX_RETRIES = 2;
    const BASE_TIMEOUT = 30000; // Increased from 15s to 30s

    const attemptFetch = async (retryAttempt: number = 0): Promise<any> => {
      const controller = new AbortController();
      // Use exponential backoff: 30s, 45s, 60s for retries
      const timeoutMs = BASE_TIMEOUT + (retryAttempt * 15000);
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const cacheParams = { page, limit, search, sortBy };

        const cachedBrands = await buyerPageCache.getFromMemory<any>(cacheKeys.BRANDS, cacheParams);

        if (cachedBrands && !search) {
          if (isMountedRef.current) {
            setBrands(cachedBrands.brands || []);
            setTotal(cachedBrands.total || 0);
            setTotalPages(cachedBrands.totalPages || 0);
            setIsLoading(false);
            setIsFromCache(true);
          }
          clearTimeout(timeout);
          return;
        }

        const queryParams = new URLSearchParams();
        queryParams.set(
          'input',
          JSON.stringify({
            page,
            limit,
            search: search || undefined,
            sortBy: sortBy || undefined,
          })
        );

        const response = await fetch(`/api/trpc/brands.getAllBrands?${queryParams.toString()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        // Check HTTP status first before parsing JSON
        if (!response.ok) {
          let errorDetails = `HTTP ${response.status}`;
          try {
            const errorBody = await response.json();
            errorDetails += `: ${JSON.stringify(errorBody)}`;
          } catch {
            errorDetails += `: ${response.statusText}`;
          }
          throw new Error(`Failed to fetch brands (${errorDetails})`);
        }

        const result = await response.json();

        // Handle multiple tRPC response formats:
        // Array with wrapped result: [{ result: { data: { brands: [...] } } }]
        // Direct result object: { result: { data: { brands: [...] } } }
        // Just result: { result: { brands: [...] } }
        // Direct data: { brands: [...] }
        let brandsData = result;
        if (Array.isArray(result) && result.length > 0) {
          brandsData = result[0]?.result?.data || result[0]?.result || result[0];
        } else if (result?.result?.data) {
          brandsData = result.result.data;
        } else if (result?.result) {
          brandsData = result.result;
        }

        if (!brandsData || typeof brandsData !== 'object') {
          throw new Error('Failed to fetch brands: Invalid response format');
        }

        const transformedBrands = (brandsData.brands || []).map((brand: any) => {
          const displayName = brand.brandName || brand.name || 'Store';
          return {
            id: brand.id,
            name: displayName,
            slug: brand.slug,
            description: brand.description || brand.storeDescription,
            logoImage: brand.logoImage,
            heroImage: brand.heroImage,
            rating: brand.rating || '0',
            totalProducts: brand.totalProducts || 0,
            followersCount: brand.followersCount || 0,
            sellerId: brand.sellerId,
            storeLogo: brand.storeLogo,
            storeBanner: brand.storeBanner,
            storeDescription: brand.storeDescription,
            brandName: brand.brandName,
            seller: {
              id: brand.sellerId,
              name: displayName,
            },
            brand_name: displayName,
            logo: brand.storeLogo || brand.logoImage,
            hero_image: brand.storeBanner || brand.heroImage,
            followers_count: brand.followersCount || 0,
            is_verified: true,
          };
        });

        const responseData = {
          brands: transformedBrands,
          total: brandsData.total || 0,
          totalPages: brandsData.totalPages || 0,
        };

        await buyerPageCache.set(cacheKeys.BRANDS, responseData, cacheParams);

        if (isMountedRef.current) {
          setBrands(transformedBrands);
          setTotal(brandsData.total || 0);
          setTotalPages(brandsData.totalPages || 0);
          setIsLoading(false);
          setIsFromCache(false);
        }
      } catch (err: any) {
        clearTimeout(timeout);
        
        // Retry on timeout if we haven't exhausted retries
        if (err.name === 'AbortError' && retryAttempt < MAX_RETRIES) {
          console.warn(`[useBrandsCached] Request timeout, retrying... (attempt ${retryAttempt + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryAttempt)));
          return attemptFetch(retryAttempt + 1);
        }
        throw err;
      }
    };

    try {
      await attemptFetch();
    } catch (err: any) {
      let errorMsg = 'Failed to fetch brands';

      if (err.name === 'AbortError') {
        errorMsg = `Request timeout after ${MAX_RETRIES + 1} attempts (30-60 seconds)`;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }

      const localStorageCached = await buyerPageCache.getFromLocalStorage<any>(
        cacheKeys.BRANDS,
        cacheParamsRef.current
      );

      if (localStorageCached && isMountedRef.current) {
        setBrands(localStorageCached.brands || []);
        setTotal(localStorageCached.total || 0);
        setTotalPages(localStorageCached.totalPages || 0);
        setError(null);
        setIsFromCache(true);
        setIsLoading(false);
        console.warn('[useBrandsCached] Using stale localStorage cache as fallback');
      } else {
        if (isMountedRef.current) {
          setError(errorMsg);
          setIsLoading(false);
        }
        console.error('[useBrandsCached] Error:', errorMsg, {
          name: err?.name,
          stack: err?.stack,
          status: err?.status,
        });
      }
    }
  }, [page, limit, search, sortBy]);

  useEffect(() => {
    isMountedRef.current = true;
    cacheParamsRef.current = { page, limit, search, sortBy };
    fetchBrands();

    return () => {
      isMountedRef.current = false;
    };
  }, [page, limit, search, sortBy, fetchBrands]);

  return {
    brands,
    isLoading,
    error,
    total,
    totalPages,
    refetch: fetchBrands,
    isFromCache,
  };
}
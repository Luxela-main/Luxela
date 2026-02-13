'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// Cache for brands data with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // TTL in milliseconds
}

const BRANDS_CACHE = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5 * 60 * 1000; 
const REQUEST_TIMEOUT = 60000; 
const MAX_RETRIES = 2; 
const RETRY_DELAY = 500; 

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

function getCacheKey(params: any): string {
  return JSON.stringify({ page: params.page, limit: params.limit, search: params.search, sortBy: params.sortBy });
}

function getCachedBrands(cacheKey: string): any | null {
  const cached = BRANDS_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    console.log('[useBrands] Using cached brands data');
    return cached.data;
  }
  BRANDS_CACHE.delete(cacheKey);
  return null;
}

function setCachedBrands(cacheKey: string, data: any): void {
  BRANDS_CACHE.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl: CACHE_TTL,
  });
}

function getDuplicateRequest(cacheKey: string): Promise<any> | null {
  return pendingRequests.get(cacheKey) || null;
}

function setDuplicateRequest(cacheKey: string, promise: Promise<any>): void {
  pendingRequests.set(cacheKey, promise);
  promise.finally(() => pendingRequests.delete(cacheKey));
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoImage: string | null;
  heroImage: string | null;
  rating: string;
  totalProducts: number;
  followersCount: number;
  sellerId: string;
  // Seller/Store business information
  storeLogo: string | null;
  storeBanner: string | null;
  storeDescription: string | null;
  brandName: string | null;
  seller: {
    id: string;
    name: string | null;
  };
  // Component expected names
  brand_name?: string;
  logo?: string | null;
  hero_image?: string | null;
  followers_count?: number;
  is_verified?: boolean;
}

export interface UseBrandsOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'followers' | 'products' | 'name' | 'rating';
}

export interface UseBrandsResult {
  brands: Brand[];
  isLoading: boolean;
  error: string | null;
  total: number;
  totalPages: number;
  refetch: () => Promise<unknown>;
}

/**
 * Parse tRPC HTTP response and extract error details
 */
function extractErrorFromResponse(response: any, statusCode: number): string {
  if (Array.isArray(response) && response.length > 0) {
    const firstItem = response[0];
    if (firstItem.error) {
      return firstItem.error.message || JSON.stringify(firstItem.error) || 'tRPC error - unknown';
    }
    if (firstItem.result?.data) {
      return 'Response received but no data available';
    }
  }

  if (response.error) {
    return response.error.message || JSON.stringify(response.error) || 'tRPC error - unknown';
  }

  if (response.result?.data) {
    return 'Response received but processing failed';
  }

  if (!response || (typeof response === 'object' && Object.keys(response).length === 0)) {
    return `HTTP ${statusCode}: Empty response from server`;
  }

  return JSON.stringify(response) || `HTTP ${statusCode}: Unknown error`;
}

/**
 * Extract brand data from tRPC response
 */
function extractBrandsFromResponse(response: any): {
  brands: any[];
  total: number;
  totalPages: number;
} {
  let data = response;

  if (Array.isArray(response) && response.length > 0) {
    data = response[0];
  }

  // Handle different response structures
  let brandsData: any = null;
  
  if (data?.result?.data) {
    brandsData = data.result.data;
  } else if (data?.result) {
    brandsData = data.result;
  } else if (data?.brands !== undefined) {
    brandsData = data;
  } else if (typeof data === 'object' && data !== null) {
    brandsData = data;
  }

  if (!brandsData || typeof brandsData !== 'object') {
    console.warn('[extractBrandsFromResponse] Could not extract brands data from response:', response);
    return {
      brands: [],
      total: 0,
      totalPages: 0,
    };
  }

  const brands = Array.isArray(brandsData.brands) ? brandsData.brands : [];
  const total = typeof brandsData.total === 'number' ? brandsData.total : 0;
  const totalPages = typeof brandsData.totalPages === 'number' ? brandsData.totalPages : 0;
  
  console.log('[extractBrandsFromResponse] Extracted brands:', {
    brandCount: brands.length,
    total,
    totalPages,
  });

  return {
    brands,
    total,
    totalPages,
  };
}

/**
 * Brands hook using tRPC endpoint
 * Fetches brand information with real follower counts from database
 * Includes seller business information and dynamic product counts
 */
export function useBrands({
  page = 1,
  limit = 20,
  search,
  sortBy = 'followers',
}: UseBrandsOptions = {}): UseBrandsResult {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const isMountedRef = useRef(true);

  const fetchBrands = useCallback(async (attemptNumber = 1) => {
    let timeoutId: NodeJS.Timeout | null = null;
    let controller: AbortController | null = null;
    
    try {
      const cacheKey = getCacheKey({ page, limit, search, sortBy });
      
      // Check cache first
      const cachedData = getCachedBrands(cacheKey);
      if (cachedData) {
        if (isMountedRef.current) {
          setBrands(cachedData.brands);
          setTotal(cachedData.total);
          setTotalPages(cachedData.totalPages);
          setIsLoading(false);
          setError(null);
        }
        return cachedData;
      }
      
      // Check for duplicate request
      const duplicateRequest = getDuplicateRequest(cacheKey);
      if (duplicateRequest) {
        console.log('[useBrands] Reusing in-flight request (deduplication)');
        return duplicateRequest;
      }
      
      if (isMountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

      const queryParams = new URLSearchParams();
      queryParams.set('input', JSON.stringify({
        page,
        limit,
        search: search || undefined,
        sortBy: sortBy || undefined,
      }));

      console.log('[useBrands] Fetching brands...', { page, limit, search, sortBy, attemptNumber, maxRetries: MAX_RETRIES });
      
      const fetchPromise = (async () => {
        controller = new AbortController();
        // Set timeout to abort the request if it takes too long
        // The controller must be created BEFORE setting the timeout callback
        timeoutId = setTimeout(() => {
          if (controller) {
            controller.abort();
          }
        }, REQUEST_TIMEOUT);
      
        const response = await fetch(
          `/api/trpc/brands.getAllBrands?${queryParams.toString()}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
          }
        );
        
        // Clear timeout immediately after fetch completes (success or failure)
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        console.log('[useBrands] Response received', { status: response.status, statusText: response.statusText });

        let result: any;
        let responseText = '';
        try {
          responseText = await response.clone().text();
          result = JSON.parse(responseText);
        } catch (parseError) {
          const err = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
          throw new Error(`Failed to parse response: ${err}`);
        }

        if ((Array.isArray(result) && result[0]?.error) || result.error) {
          const errorMsg = extractErrorFromResponse(result, response.status);
          const isRetryable = response.status >= 500 || response.status === 408;
          if (isRetryable && attemptNumber < MAX_RETRIES) {
            console.warn(`[useBrands] Retryable error, attempt ${attemptNumber}/${MAX_RETRIES}`);
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attemptNumber));
            return fetchBrands(attemptNumber + 1);
          }
          throw new Error(`Server error: ${errorMsg}`);
        }

        if (!response.ok) {
          const errorMsg = extractErrorFromResponse(result, response.status);
          const isRetryable = response.status >= 500 || response.status === 408;
          if (isRetryable && attemptNumber < MAX_RETRIES) {
            console.warn(`[useBrands] Retryable HTTP error, attempt ${attemptNumber}/${MAX_RETRIES}: ${response.status}`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attemptNumber));
            return fetchBrands(attemptNumber + 1);
          }
          throw new Error(`HTTP ${response.status}: ${errorMsg}`);
        }

        const { brands: brandsData, total: totalCount, totalPages: totalPageCount } =
          extractBrandsFromResponse(result);

        // Transform response with real follower counts
        const transformedBrands: Brand[] = brandsData.map((brand: any) => {
        const displayName = brand.brandName || brand.name || 'Store';

        const transformed = {
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
            name: brand.brandName || brand.name || 'Store',
          },
        } as Brand;

        // Add component-expected properties
        transformed.brand_name = displayName;
        transformed.logo = brand.storeLogo || brand.logoImage;
        transformed.hero_image = brand.storeBanner || brand.heroImage;
        transformed.followers_count = brand.followersCount || 0;
        transformed.is_verified = true;

        if (!brand.storeLogo && !brand.logoImage) {
          console.warn(`Brand "${brand.name}" has no logo`, {
            brandId: brand.id,
            hasFollowers: brand.followersCount > 0,
          });
        }

        return transformed;
      });

      // Cache the result
      const responseData = {
        brands: transformedBrands,
        total: totalCount,
        totalPages: totalPageCount,
      };
      setCachedBrands(cacheKey, responseData);
      
      if (isMountedRef.current) {
        setBrands(transformedBrands);
        setTotal(totalCount);
        setTotalPages(totalPageCount);
        setIsLoading(false);
        setError(null);
        setRetryCount(0);
      }
      
      return responseData;
      })();
      
      // Set up request deduplication
      setDuplicateRequest(cacheKey, fetchPromise);
      
      return await fetchPromise;
    } catch (err: any) {
      // Clean up timeout on error
      if (timeoutId) clearTimeout(timeoutId);
      
      let errorMessage = 'Failed to fetch brands';
      let isAbortError = false;

      if (err instanceof DOMException && err.name === 'AbortError') {
        isAbortError = true;
        errorMessage = 'Request timeout - retrying...';
        if (attemptNumber < MAX_RETRIES) {
          console.warn(`[useBrands] Request timeout, attempt ${attemptNumber}/${MAX_RETRIES}`);
          setRetryCount(attemptNumber);
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * attemptNumber));
          // Recursive retry
          return fetchBrands(attemptNumber + 1);
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      if (!isAbortError || attemptNumber >= MAX_RETRIES) {
        setError(errorMessage);
        const errorLog = {
          message: errorMessage,
          errorType: err?.name || 'Unknown',
          errorCode: err?.code,
          originalError: String(err),
          queryParams: { page, limit, search, sortBy },
          attemptNumber,
          isAbortError,
          stack: err?.stack || 'No stack trace',
        };
        console.error('[useBrands] Error fetching brands:', JSON.stringify(errorLog, null, 2));
      }
      
      if (attemptNumber >= MAX_RETRIES) {
        setBrands([]);
        setIsLoading(false);
      }
    } finally {
      // Only clear loading state on final attempt or if not retrying
      if (attemptNumber >= MAX_RETRIES) {
        setIsLoading(false);
      }
    }
  }, [page, limit, search, sortBy]);

  useEffect(() => {
    fetchBrands();
  }, [page, limit, search, sortBy]);

  return {
    brands,
    isLoading,
    error,
    total,
    totalPages,
    refetch: fetchBrands,
  };
}

/**
 * Fetch detailed brand information with products
 * Includes real follower count and product count
 */
export function useBrandDetails(brandId: string, page = 1, limit = 20) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrandDetails = useCallback(async () => {
    if (!brandId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      queryParams.set('input', JSON.stringify({
        brandId,
        page: page || undefined,
        limit: limit || undefined,
      }));

      const response = await fetch(
        `/api/trpc/brands.getBrandDetails?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      let result: any;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error(
          `Failed to parse response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`
        );
      }

      if ((Array.isArray(result) && result[0]?.error) || result.error) {
        const errorMsg = extractErrorFromResponse(result, response.status);
        throw new Error(errorMsg);
      }

      if (!response.ok) {
        const errorMsg = extractErrorFromResponse(result, response.status);
        throw new Error(errorMsg);
      }

      let brandData = result;
      if (Array.isArray(result) && result.length > 0) {
        brandData = result[0].result?.data || result[0];
      } else if (result.result?.data) {
        brandData = result.result.data;
      }

      const enrichedBrand = {
        ...brandData.brand,
        storeLogo: brandData.brand?.storeLogo,
        storeBanner: brandData.brand?.storeBanner,
        storeDescription: brandData.brand?.storeDescription,
        brandName: brandData.brand?.brandName,
        logoImage: brandData.brand?.storeLogo || brandData.brand?.logoImage,
        heroImage: brandData.brand?.storeBanner || brandData.brand?.heroImage,
      };

      setData({
        brand: enrichedBrand,
        products: brandData.products || [],
        totalProducts: brandData.brand?.totalProducts || 0,
        followersCount: brandData.brand?.followersCount || 0,
      });
    } catch (err: any) {
      let errorMessage = 'Failed to fetch brand details';

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      setError(errorMessage);
      console.error('Error fetching brand details:', {
        message: errorMessage,
        originalError: err,
        brandId,
      });
    } finally {
      setIsLoading(false);
    }
  }, [brandId, page, limit]);

  useEffect(() => {
    fetchBrandDetails();
  }, [fetchBrandDetails]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchBrandDetails,
  };
}

/**
 * Custom hook to check if user is following a brand
 * Uses tRPC backend for real-time synchronization
 */
export function useIsFollowingBrand(brandId: string) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkFollowStatus = useCallback(async () => {
    if (!brandId) {
      setIsFollowing(false);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('input', JSON.stringify({ brandId }));

      const response = await fetch(
        `/api/trpc/buyer.isFollowingBrand?${params.toString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.result?.data || false);
      }
    } catch (err) {
      console.error('Check follow status error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    checkFollowStatus();
  }, [checkFollowStatus]);

  return { isFollowing, isLoading, refetch: checkFollowStatus };
}

/**
 * Hook to track real-time brand followers count
 * Subscribes to follow/unfollow events via Supabase and updates count
 */
export function useBrandFollowersCount(brandId: string, initialCount: number = 0) {
  const [followersCount, setFollowersCount] = useState(initialCount);
  const [isUpdating, setIsUpdating] = useState(false);
  const [supabase] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const { createClient } = require('@/utils/supabase/client');
      return createClient();
    } catch (err) {
      return null;
    }
  });

  // Fetch current followers count from the database
  const fetchFollowersCount = useCallback(async () => {
    if (!supabase || !brandId) return;

    try {
      setIsUpdating(true);
      const { count, error } = await supabase
        .from('buyer_brand_follows')
        .select('id', { count: 'exact', head: true })
        .eq('brand_id', brandId);

      if (!error && count !== null) {
        setFollowersCount(count);
      }
    } catch (err) {
      console.error('Error fetching followers count:', err);
    } finally {
      setIsUpdating(false);
    }
  }, [supabase, brandId]);

  // Initial fetch
  useEffect(() => {
    if (initialCount > 0) {
      setFollowersCount(initialCount);
    } else {
      fetchFollowersCount();
    }
  }, [initialCount, fetchFollowersCount]);

  // Subscribe to real-time changes in follow relationships
  useEffect(() => {
    if (!supabase || !brandId) return;

    const subscription = supabase
      .channel(`brand-followers-${brandId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'buyer_brand_follows',
          filter: `brand_id=eq.${brandId}`,
        },
        async (payload: any) => {
          // Refetch the count when any follow relationship changes
          await fetchFollowersCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, brandId, fetchFollowersCount]);

  return {
    followersCount,
    isUpdating,
    refetch: fetchFollowersCount,
  };
}

/**
 * Hook to update brand followers count optimistically with fallback
 * Used when user follows/unfollows a brand for instant UI feedback
 */
export function useOptimisticFollowerUpdate(brandId: string): {
  tempOffset: number;
  updateCount: (isFollowing: boolean) => Promise<void>;
  resetOffset: () => void;
  setActualCount: (count: number) => void;
  actualCount: number | null;
} {
  const [tempOffset, setTempOffset] = useState(0);
  const [actualCount, setActualCountState] = useState<number | null>(null);

  const updateCount = useCallback(async (isFollowing: boolean) => {
    // Optimistic update - increment or decrement by 1
    setTempOffset(isFollowing ? 1 : -1);
  }, []);

  const resetOffset = useCallback(() => {
    // Reset offset after the real follower count has been fetched
    setTempOffset(0);
  }, []);

  const setActualCount = useCallback((count: number) => {
    // Set the actual count from server response
    // This will override any temporary offsets
    setActualCountState(count);
    setTempOffset(0);
  }, []);

  return { tempOffset, updateCount, resetOffset, setActualCount, actualCount };
}
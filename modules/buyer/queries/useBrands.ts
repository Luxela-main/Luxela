'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// Cache for brands data with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; 
}

const BRANDS_CACHE = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes - extended for better performance
const REQUEST_TIMEOUT = 90000; // 90 seconds - increased timeout for production while DB indexes optimize
const MAX_RETRIES = 3; // Reduced since DB is now faster with indexes
const RETRY_DELAY = 500; // Exponential backoff starts here
const MAX_TIMEOUT = 90000; // 90 seconds max timeout for retries

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

// Request queue to prevent thundering herd
let requestQueue: Array<() => Promise<any>> = [];
let isProcessingQueue = false;
const MAX_CONCURRENT_REQUESTS = 2;
let activeRequests = 0;

async function enqueueRequest<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    requestQueue.push(async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
    processQueue();
  });
}

async function processQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++;
    const request = requestQueue.shift();
    if (request) {
      await request();
    }
    activeRequests--;
  }

  isProcessingQueue = false;
  if (requestQueue.length > 0) {
    processQueue();
  }
}

// Exponential backoff calculation
function getBackoffDelay(attemptNumber: number): number {
  const delay = RETRY_DELAY * Math.pow(2, attemptNumber - 1);
  return Math.min(delay, 8000);
}

// Adaptive timeout calculation
function getAdaptiveTimeout(attemptNumber: number): number {
  const baseTimeout = REQUEST_TIMEOUT + (attemptNumber - 1) * 15000;
  return Math.min(baseTimeout, MAX_TIMEOUT);
}

function getCacheKey(params: any): string {
  return JSON.stringify({ page: params.page, limit: params.limit, search: params.search, sortBy: params.sortBy });
}

function getCachedBrands(cacheKey: string): any | null {
  const cached = BRANDS_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
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

interface BrandFetchResult {
  brands: Brand[];
  total: number;
  totalPages: number;
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

  // Handle tRPC batch response format: Array with single object containing result
  if (Array.isArray(response) && response.length > 0) {
    const firstItem = response[0];
    if (firstItem?.result?.data) {
      data = firstItem.result.data;
    } else if (firstItem?.result) {
      data = firstItem.result;
    } else {
      data = firstItem;
    }
  } else if (response?.result?.data) {
    // Handle single response with result.data
    data = response.result.data;
  } else if (response?.result) {
    // Handle single response with result
    data = response.result;
  }

  // Validate we have the brands array
  if (!data || typeof data !== 'object') {
    return {
      brands: [],
      total: 0,
      totalPages: 0,
    };
  }

  // Extract arrays safely
  const brands = Array.isArray(data.brands) ? data.brands : [];
  const total = typeof data.total === 'number' ? data.total : 0;
  const totalPages = typeof data.totalPages === 'number' ? data.totalPages : 0;

  return {
    brands,
    total,
    totalPages,
  };
}

/**
 * Brands hook using tRPC endpoint - OPTIMIZED version
 * Fetches brand information with real follower counts from database
 * Includes seller business information and dynamic product counts
 * 
 * Key optimizations:
 * - Increased cache TTL to 15 minutes
 * - 30-second timeout instead of 60 seconds
 * - Better retry strategy (3 attempts, 300ms delays)
 * - Cleaner logging without duplicates
 * - Proper request deduplication
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
  const isMountedRef = useRef(true);

  const fetchBrands = useCallback<(attemptNumber?: number) => Promise<BrandFetchResult>>(async (attemptNumber = 1) => {
    return enqueueRequest(async () => fetchBrandsInternal(attemptNumber));
  }, []);

  const fetchBrandsInternal = useCallback<(attemptNumber?: number) => Promise<BrandFetchResult>>(async (attemptNumber = 1) => {
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
      
      // Check for duplicate in-flight request
      const duplicateRequest = getDuplicateRequest(cacheKey);
      if (duplicateRequest) {
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

      // Create controller outside async IIFE to ensure proper scope
      controller = new AbortController();
      
      // Set timeout to abort the request
      timeoutId = setTimeout(() => {
        if (controller && !controller.signal.aborted) {
          controller.abort();
        }
      }, REQUEST_TIMEOUT);

      const fetchPromise: Promise<BrandFetchResult> = (async () => {
      
        const response = await fetch(
          `/api/trpc/brands.getAllBrands?${queryParams.toString()}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
          }
        );
        
        // Clear timeout immediately after fetch completes
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

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
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attemptNumber));
            return fetchBrands(attemptNumber + 1);
          }
          throw new Error(`HTTP ${response.status}: ${errorMsg}`);
        }
        
        const { brands: brandsData, total: totalCount, totalPages: totalPageCount } =
          extractBrandsFromResponse(result);

        // Handle empty response
        if (brandsData.length === 0) {
          const emptyResult: BrandFetchResult = {
            brands: [],
            total: 0,
            totalPages: 0,
          };
          setCachedBrands(cacheKey, emptyResult);
          if (isMountedRef.current) {
            setBrands([]);
            setTotal(0);
            setTotalPages(0);
            setIsLoading(false);
            setError(null);
          }
          return emptyResult;
        }

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

        return transformed;
      });

      // Cache the result
      const responseData: BrandFetchResult = {
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
      }
      
      return responseData;
      })();
      
      // Set up request deduplication
      setDuplicateRequest(cacheKey, fetchPromise);
      
      const result: BrandFetchResult = await fetchPromise;
      return result;
    } catch (err: any) {
      // Clean up timeout on error
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      let errorMessage = 'Failed to fetch brands';
      let isAbortError = false;

      // Handle both standard AbortError and custom timeout errors
      if ((err instanceof DOMException && err.name === 'AbortError') || (err instanceof Error && err.message.includes('timeout'))) {
        isAbortError = true;
        errorMessage = 'Request timeout - retrying...';
        if (attemptNumber < MAX_RETRIES) {
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
        console.error('[useBrands] Error:', {
          message: errorMessage,
          errorType: err?.name || 'Unknown',
          queryParams: { page, limit, search, sortBy },
          attemptNumber,
        });
      }
      
      if (attemptNumber >= MAX_RETRIES) {
        setBrands([]);
        setIsLoading(false);
      }

      throw err;
    } finally {
      // Clean up timeout in finally block
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      // Only clear loading state on final attempt
      if (attemptNumber >= MAX_RETRIES) {
        setIsLoading(false);
      }
    }
  }, [page, limit, search, sortBy]);

  useEffect(() => {
    isMountedRef.current = true;
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
      console.error('[useBrandDetails] Error:', {
        message: errorMessage,
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
      console.error('[useIsFollowingBrand] Check follow status error:', err);
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
      console.error('[useBrandFollowersCount] Error fetching followers count:', err);
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
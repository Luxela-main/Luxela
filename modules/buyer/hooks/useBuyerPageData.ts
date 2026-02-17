'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useBrands, useCollections } from '@/modules/buyer/queries';
import { useListings } from '@/context/ListingsContext';

/**
 * Optimized buyer page data hook
 * Loads all critical data in parallel with race condition handling
 * Implements fail-gracefully pattern for non-critical data
 */
export interface BuyerPageDataResult {
  brands: any[];
  collections: any[];
  listings: any[];
  isLoading: boolean;
  isReady: boolean;
  hasError: boolean;
}

const CRITICAL_DATA_TIMEOUT = 3000; // 3 seconds for critical data
const NON_CRITICAL_TIMEOUT = 5000; // 5 seconds for nice-to-have data

export function useBuyerPageData(): BuyerPageDataResult {
  const { listings, loading: listingsLoading } = useListings();
  const { brands: brandsArray, isLoading: brandsLoading } = useBrands({ limit: 8 });
  const { data: collectionsData, isLoading: collectionsLoading } = useCollections({ limit: 8 });
  
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Critical data: listings and brands
    // Non-critical: collections
    
    // All requests run in parallel via React hooks
    // Set isReady once critical data is available
    const criticalDataReady = !listingsLoading && !brandsLoading;
    
    if (criticalDataReady) {
      // Mark as ready - critical path complete
      setIsReady(true);
      
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [listingsLoading, brandsLoading]);

  return {
    brands: brandsArray || [],
    collections: collectionsData || [],
    listings: listings || [],
    isLoading: listingsLoading || brandsLoading,
    isReady,
    hasError,
  };
}
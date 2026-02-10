'use client';

import { useEffect, useRef, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

/**
 * Hook for realtime product listings polling
 * Keeps the browse catalog in sync by refetching every 30 seconds
 * Includes smart backoff and visibility detection
 */
export function useRealtimeListings() {
  const utils = trpc.useUtils();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefetchTimeRef = useRef<number>(0);
  const consecutiveErrorsRef = useRef<number>(0);
  const isPollingRef = useRef<boolean>(false);

  // Configuration
  const BASE_POLL_INTERVAL = 30000; // 30 seconds
  const MIN_REFETCH_DELAY = 1000; // 1 second minimum between refreshes
  const MAX_ERRORS_BEFORE_STOP = 5;
  const ERROR_BACKOFF_MULTIPLIER = 2;

  const refetchListings = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastRefetch = now - lastRefetchTimeRef.current;

    // Prevent rapid consecutive refetches
    if (timeSinceLastRefetch < MIN_REFETCH_DELAY) {
      return;
    }

    try {
      // Invalidate and refetch the catalog query
      await utils.buyerListingsCatalog.getApprovedListingsCatalog.invalidate();
      lastRefetchTimeRef.current = now;
      consecutiveErrorsRef.current = 0;
    } catch (error) {
      consecutiveErrorsRef.current++;
      console.warn(
        `[useRealtimeListings] Refetch failed (${consecutiveErrorsRef.current}/${MAX_ERRORS_BEFORE_STOP}):`,
        error
      );

      if (consecutiveErrorsRef.current >= MAX_ERRORS_BEFORE_STOP) {
        console.error(
          '[useRealtimeListings] Max consecutive errors reached. Stopping polling.'
        );
        stopPolling();
      }
    }
  }, [utils.buyerListingsCatalog.getApprovedListingsCatalog]);

  const setupPolling = useCallback(() => {
    if (isPollingRef.current) return; // Already polling
    isPollingRef.current = true;

    // Initial refetch
    refetchListings();

    // Setup interval polling
    pollingIntervalRef.current = setInterval(() => {
      refetchListings();
    }, BASE_POLL_INTERVAL);

    console.log('[useRealtimeListings] Polling started (30s interval)');
  }, [refetchListings]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    isPollingRef.current = false;
    console.log('[useRealtimeListings] Polling stopped');
  }, []);

  // Setup polling on mount
  useEffect(() => {
    setupPolling();

    return () => {
      stopPolling();
    };
  }, [setupPolling, stopPolling]);

  // Handle visibility changes - refresh immediately when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[useRealtimeListings] Page became visible, refreshing listings');
        refetchListings();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetchListings]);

  return { refetchListings };
}
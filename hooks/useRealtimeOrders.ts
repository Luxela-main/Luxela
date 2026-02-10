'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseRealtimeOrdersOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number; 
  refetchOnWindowFocus?: boolean; 
  refetchOnInteraction?: boolean;
  maxRetries?: number;
  adaptiveRefresh?: boolean;
}

export function useRealtimeOrders(options: UseRealtimeOrdersOptions = {}) {
  const {
    enabled = true,
    refetchInterval = 30000,
    staleTime = 10000, 
    refetchOnWindowFocus = true,
    refetchOnInteraction = true,
    maxRetries = 5,
    adaptiveRefresh = true,
  } = options;

  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRefetchRef = useRef<number>(0);
  const errorCountRef = useRef<number>(0);
  const [isPolling, setIsPolling] = useState(enabled);
  const [currentInterval, setCurrentInterval] = useState(refetchInterval);
  const consecutiveSuccessRef = useRef<number>(0);

  /**
   * Find the purchase history query in the cache
   */
  const getOrdersQuery = useCallback(() => {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.findAll({ type: 'active' });
    return queries.find((q) => {
      const key = q.queryKey;
      return key[0] === 'buyer' && key[1] === 'getPurchaseHistory';
    });
  }, [queryClient]);

  /**
   * Manually refresh orders data with debouncing to prevent rapid requests
   */
  const refreshOrders = useCallback(async () => {
    if (!enabled) return;

    const now = Date.now();
    const timeSinceLastRefetch = now - lastRefetchRef.current;

    // Debounce: don't refetch if last one was less than 1 second ago
    if (timeSinceLastRefetch < 1000) {
      return;
    }

    lastRefetchRef.current = now;

    try {
      const query = getOrdersQuery();
      if (query) {
        // Invalidate to mark data as stale
        queryClient.invalidateQueries({
          queryKey: ['buyer', 'getPurchaseHistory'],
          exact: false,
        });

        // Refetch data
        await queryClient.refetchQueries({
          queryKey: ['buyer', 'getPurchaseHistory'],
          exact: false,
          type: 'active',
        });

        // Track successful refreshes for adaptive intervals
        consecutiveSuccessRef.current++;
        errorCountRef.current = 0;

        // Adaptive refresh: slow down polling if many successful refreshes
        if (adaptiveRefresh && consecutiveSuccessRef.current > 5) {
          const newInterval = Math.min(currentInterval + 5000, refetchInterval * 2);
          if (newInterval !== currentInterval) {
            setCurrentInterval(newInterval);
          }
        }
      }
    } catch (error) {
      errorCountRef.current++;
      consecutiveSuccessRef.current = 0;
      console.error('[Orders] Error refreshing orders:', error);

      // Exponential backoff: increase interval on errors
      if (adaptiveRefresh && errorCountRef.current > 2) {
        const backoffInterval = Math.min(
          refetchInterval + errorCountRef.current * 5000,
          refetchInterval * 2
        );
        if (backoffInterval !== currentInterval) {
          setCurrentInterval(backoffInterval);
        }
      }

      // Stop polling if too many errors
      if (errorCountRef.current >= maxRetries) {
        console.warn('[Orders] Too many errors in order polling, stopping');
        setIsPolling(false);
      }
    }
  }, [enabled, queryClient, getOrdersQuery, adaptiveRefresh, currentInterval, refetchInterval, maxRetries]);

  /**
   * Mark orders as stale
   */
  const markOrdersAsStale = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['buyer', 'getPurchaseHistory'],
      exact: false,
    });
  }, [queryClient]);

  /**
   * Cancel ongoing requests
   */
  const cancelRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    setIsPolling(false);
    cancelRequests();
  }, [cancelRequests]);

  /**
   * Start polling
   */
  const startPolling = useCallback(() => {
    if (!enabled) return;
    setIsPolling(true);
  }, [enabled]);

  // Set up polling interval with enhanced logic
  useEffect(() => {
    if (!enabled || !isPolling) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial refetch
    void refreshOrders();

    // Set up polling interval with current dynamic interval
    intervalRef.current = setInterval(() => {
      void refreshOrders();
    }, currentInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, isPolling, currentInterval, refreshOrders]);

  /**
   * Listen for window focus and visibility changes to refresh orders
   */
  useEffect(() => {
    if (!enabled || !refetchOnWindowFocus) return;

    const handleFocus = () => {
      console.log('[Orders] Window regained focus - refreshing orders');
      markOrdersAsStale();
      void refreshOrders();
      // Reset to faster polling when returning to page
      if (adaptiveRefresh) {
        setCurrentInterval(refetchInterval);
        consecutiveSuccessRef.current = 0;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Orders] Tab became visible - refreshing orders');
        markOrdersAsStale();
        void refreshOrders();
        // Reset to faster polling when returning to page
        if (adaptiveRefresh) {
          setCurrentInterval(refetchInterval);
          consecutiveSuccessRef.current = 0;
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, refetchOnWindowFocus, markOrdersAsStale, refreshOrders, adaptiveRefresh, refetchInterval]);

  /**
   * Listen for user interaction to potentially refresh orders
   */
  useEffect(() => {
    if (!enabled || !refetchOnInteraction) return;

    const handleInteraction = () => {
      // Only refetch on significant user actions, not on every interaction
      markOrdersAsStale();
    };

    // Listen for page visibility returning
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleInteraction();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, refetchOnInteraction, markOrdersAsStale]);

  return {
    refreshOrders,
    markOrdersAsStale,
    cancelRequests,
    stopPolling,
    startPolling,
    isPolling,
    currentInterval,
    resetInterval: () => {
      setCurrentInterval(refetchInterval);
      consecutiveSuccessRef.current = 0;
      errorCountRef.current = 0;
    },
  };
}
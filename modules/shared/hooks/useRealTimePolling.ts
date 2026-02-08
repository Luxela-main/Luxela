'use client';

import { useEffect, useRef } from 'react';
import { UseQueryResult } from '@tanstack/react-query';

interface PollingConfig {
  enabled?: boolean;
  interval?: number; // in milliseconds
  retryOnError?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const DEFAULT_POLLING_INTERVAL = 30000; // 30 seconds

/**
 * Hook to enable real-time polling for any query
 * Automatically refetches data at specified intervals
 * 
 * @param query - The useQuery result object
 * @param config - Polling configuration
 * 
 * @example
 * const ordersQuery = useOrders();
 * useRealTimePolling(ordersQuery, { enabled: true, interval: 30000 });
 */
export function useRealTimePolling<T>(
  query: UseQueryResult<T, Error>,
  config: PollingConfig = {}
): void {
  const {
    enabled = true,
    interval = DEFAULT_POLLING_INTERVAL,
    retryOnError = true,
    onSuccess,
    onError,
  } = config;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const errorCountRef = useRef<number>(0);
  const MAX_CONSECUTIVE_ERRORS = 3;

  useEffect(() => {
    // Don't start polling if disabled or query is not ready
    if (!enabled || !query.data) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Initial setup: record first fetch time
    lastFetchTimeRef.current = Date.now();

    // Start polling
    intervalRef.current = setInterval(async () => {
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTimeRef.current;

      // Only refetch if the minimum interval has passed
      if (timeSinceLastFetch >= interval) {
        try {
          await query.refetch();
          lastFetchTimeRef.current = now;
          errorCountRef.current = 0; // Reset error counter on success
          onSuccess?.();
        } catch (error) {
          errorCountRef.current++;
          const err = error instanceof Error ? error : new Error(String(error));
          onError?.(err);

          // Stop polling if too many consecutive errors
          if (!retryOnError || errorCountRef.current >= MAX_CONSECUTIVE_ERRORS) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }
      }
    }, Math.max(1000, interval)); // Minimum 1 second check interval

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, retryOnError, query, onSuccess, onError]);
}

/**
 * Hook for multi-query real-time polling
 * Polls multiple queries with a single interval
 * 
 * @example
 * useRealTimePollingMulti([ordersQuery, notificationsQuery, statsQuery], {
 *   enabled: true,
 *   interval: 30000
 * });
 */
export function useRealTimePollingMulti<T>(
  queries: UseQueryResult<T, Error>[],
  config: PollingConfig = {}
): void {
  const {
    enabled = true,
    interval = DEFAULT_POLLING_INTERVAL,
    retryOnError = true,
    onSuccess,
    onError,
  } = config;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const errorCountRef = useRef<number>(0);
  const MAX_CONSECUTIVE_ERRORS = 3;

  useEffect(() => {
    // Don't start polling if disabled or no queries have data
    const hasData = queries.some(q => q.data);
    if (!enabled || !hasData) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    lastFetchTimeRef.current = Date.now();

    // Start polling
    intervalRef.current = setInterval(async () => {
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTimeRef.current;

      if (timeSinceLastFetch >= interval) {
        try {
          // Refetch all queries in parallel
          await Promise.all(queries.map(q => q.refetch()));
          lastFetchTimeRef.current = now;
          errorCountRef.current = 0;
          onSuccess?.();
        } catch (error) {
          errorCountRef.current++;
          const err = error instanceof Error ? error : new Error(String(error));
          onError?.(err);

          if (!retryOnError || errorCountRef.current >= MAX_CONSECUTIVE_ERRORS) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }
      }
    }, Math.max(1000, interval));

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, retryOnError, queries, onSuccess, onError]);
}

/**
 * Hook for smart polling that adjusts based on page visibility
 * Reduces polling frequency when tab is not visible
 * 
 * @example
 * useSmartRealTimePolling(ordersQuery, {
 *   activeInterval: 30000,  // 30 seconds when visible
 *   inactiveInterval: 120000 // 2 minutes when hidden
 * });
 */
export function useSmartRealTimePolling<T>(
  query: UseQueryResult<T, Error>,
  config: PollingConfig & {
    activeInterval?: number;
    inactiveInterval?: number;
  } = {}
): void {
  const {
    enabled = true,
    activeInterval = DEFAULT_POLLING_INTERVAL,
    inactiveInterval = DEFAULT_POLLING_INTERVAL * 4, // 2 minutes
    retryOnError = true,
    onSuccess,
    onError,
  } = config;

  const [isVisible, setIsVisible] = require('react').useState(true);
  const [currentInterval, setCurrentInterval] = require('react').useState(
    isVisible ? activeInterval : inactiveInterval
  );

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsVisible(visible);
      setCurrentInterval(visible ? activeInterval : inactiveInterval);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeInterval, inactiveInterval]);

  // Use the regular polling with adjusted interval
  useRealTimePolling(query, {
    enabled: enabled && currentInterval > 0,
    interval: currentInterval,
    retryOnError,
    onSuccess,
    onError,
  });
}
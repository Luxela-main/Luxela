/**
 * Enterprise-Level Polling Hook for tRPC
 * Optimized for Vercel serverless with intelligent refresh strategies
 * 
 * Features:
 * - Intelligent interval adaptation (backoff when no changes, aggressive when active)
 * - Request deduplication and batching
 * - Tab focus awareness (pause when unfocused)
 * - Memory-efficient with automatic cleanup
 * - Circuit breaker for failed requests
 * - Stale data detection with cache validation
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { UseQueryResult } from '@tanstack/react-query';

interface PollingConfig {
  /**
   * Initial polling interval in milliseconds
   * @default 10000 (10 seconds) - optimal for support dashboards
   */
  initialInterval: number;

  /**
   * Maximum polling interval (when no changes detected)
   * @default 60000 (60 seconds)
   */
  maxInterval: number;

  /**
   * Minimum polling interval (when active changes)
   * @default 3000 (3 seconds)
   */
  minInterval: number;

  /**
   * Backoff multiplier for interval increase
   * @default 1.5
   */
  backoffMultiplier: number;

  /**
   * Enable intelligent backoff (slower when no changes)
   * @default true
   */
  enableBackoff: boolean;

  /**
   * Pause polling when tab is not focused
   * @default true
   */
  pauseWhenUnfocused: boolean;

  /**
   * Max failed requests before circuit breaker activates
   * @default 3
   */
  maxFailedAttempts: number;

  /**
   * Circuit breaker recovery time in milliseconds
   * @default 30000 (30 seconds)
   */
  circuitBreakerTimeout: number;
}

interface PollingMetrics {
  refetchCount: number;
  successCount: number;
  failureCount: number;
  lastDataChange: Date | null;
  lastRefetch: Date | null;
  isFocused: boolean;
  isCircuitBroken: boolean;
}

const DEFAULT_CONFIG: PollingConfig = {
  initialInterval: 10000,
  maxInterval: 60000,
  minInterval: 3000,
  backoffMultiplier: 1.5,
  enableBackoff: true,
  pauseWhenUnfocused: true,
  maxFailedAttempts: 3,
  circuitBreakerTimeout: 30000,
};

/**
 * Enterprise polling hook for tRPC queries
 * Automatically manages poll intervals based on data changes
 * 
 * @example
 * ```tsx
 * const query = trpc.support.getDashboardMetrics.useQuery();
 * useOptimizedPolling(query, {
 *   initialInterval: 10000,
 *   enableBackoff: true
 * });
 * ```
 */
export function useOptimizedPolling<T>(
  query: UseQueryResult<T, unknown>,
  config: Partial<PollingConfig> = {}
): PollingMetrics {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  const metricsRef = useRef<PollingMetrics>({
    refetchCount: 0,
    successCount: 0,
    failureCount: 0,
    lastDataChange: null,
    lastRefetch: null,
    isFocused: true,
    isCircuitBroken: false,
  });

  const stateRef = useRef({
    currentInterval: mergedConfig.initialInterval,
    lastData: query.data,
    circuitBreakerTime: 0,
    intervalId: null as NodeJS.Timeout | null,
  });

  const [metrics, setMetrics] = useState<PollingMetrics>(metricsRef.current);

  /**
   * Detect if data has meaningfully changed
   */
  const hasDataChanged = useCallback((newData: T | undefined, oldData: T | undefined): boolean => {
    if (!newData || !oldData) return newData !== oldData;
    
    // For objects, do shallow comparison
    if (typeof newData === 'object' && typeof oldData === 'object') {
      return JSON.stringify(newData) !== JSON.stringify(oldData);
    }
    
    return newData !== oldData;
  }, []);

  /**
   * Update polling interval based on data changes
   */
  const updatePollingInterval = useCallback(() => {
    const metrics = metricsRef.current;
    const state = stateRef.current;

    if (metrics.isCircuitBroken) {
      // Don't adjust during circuit break
      return;
    }

    const hasChanged = hasDataChanged(query.data, state.lastData);

    if (hasChanged) {
      // Reset to minimum interval on data change
      state.currentInterval = mergedConfig.minInterval;
      metrics.lastDataChange = new Date();
    } else if (mergedConfig.enableBackoff) {
      // Gradually increase interval when no changes
      state.currentInterval = Math.min(
        state.currentInterval * mergedConfig.backoffMultiplier,
        mergedConfig.maxInterval
      );
    }

    state.lastData = query.data;
  }, [query.data, mergedConfig, hasDataChanged]);

  /**
   * Handle refetch with error tracking
   */
  const performRefetch = useCallback(async () => {
    const metrics = metricsRef.current;
    const state = stateRef.current;

    if (metrics.isCircuitBroken) {
      const now = Date.now();
      if (now - state.circuitBreakerTime > mergedConfig.circuitBreakerTimeout) {
        // Reset circuit breaker
        metrics.isCircuitBroken = false;
        metrics.failureCount = 0;
      } else {
        return; // Still in circuit break period
      }
    }

    try {
      await query.refetch();
      metrics.refetchCount++;
      metrics.successCount++;
      metrics.lastRefetch = new Date();
      
      // Only reset failure count on successful refetch
      metrics.failureCount = 0;

      updatePollingInterval();
    } catch (error) {
      metrics.failureCount++;
      metrics.refetchCount++;

      // Activate circuit breaker if too many failures
      if (metrics.failureCount >= mergedConfig.maxFailedAttempts) {
        metrics.isCircuitBroken = true;
        state.circuitBreakerTime = Date.now();
      }
    }

    setMetrics({ ...metrics });
  }, [query, mergedConfig, updatePollingInterval]);

  /**
   * Handle tab focus/blur for intelligent polling pause
   */
  useEffect(() => {
    if (!mergedConfig.pauseWhenUnfocused) return;

    const handleFocus = () => {
      metricsRef.current.isFocused = true;
      setMetrics({ ...metricsRef.current });
      // Trigger immediate refetch when tab regains focus
      performRefetch();
    };

    const handleBlur = () => {
      metricsRef.current.isFocused = false;
      setMetrics({ ...metricsRef.current });
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [mergedConfig.pauseWhenUnfocused, performRefetch]);

  /**
   * Main polling loop
   */
  useEffect(() => {
    const state = stateRef.current;
    const metrics = metricsRef.current;

    // Clear existing interval
    if (state.intervalId) {
      clearInterval(state.intervalId);
    }

    // Don't poll if unfocused and configured to pause
    if (!metrics.isFocused && mergedConfig.pauseWhenUnfocused) {
      return;
    }

    // Don't poll during circuit break
    if (metrics.isCircuitBroken) {
      state.intervalId = setInterval(performRefetch, mergedConfig.circuitBreakerTimeout);
      return;
    }

    // Set up polling
    state.intervalId = setInterval(() => {
      performRefetch();
    }, state.currentInterval);

    return () => {
      if (state.intervalId) {
        clearInterval(state.intervalId);
      }
    };
  }, [metrics.isFocused, mergedConfig, performRefetch]);

  return metrics;
}

/**
 * Hook for managing multiple polling queries with shared state
 * Useful for dashboards with multiple tRPC queries
 * 
 * @example
 * ```tsx
 * const metrics = trpc.support.getDashboardMetrics.useQuery();
 * const tickets = trpc.support.getTickets.useQuery();
 * 
 * const { allMetrics, isAnyFailed } = useMultiplePolling(
 *   [
 *     { query: metrics, config: { initialInterval: 10000 } },
 *     { query: tickets, config: { initialInterval: 15000 } }
 *   ]
 * );
 * ```
 */
export function useMultiplePolling<T extends readonly any[]>(
  queries: {
    query: UseQueryResult<any, unknown>;
    config?: Partial<PollingConfig>;
  }[]
) {
  const metricsArray = queries.map(({ query, config }) =>
    useOptimizedPolling(query, config)
  );

  const isAnyFailed = metricsArray.some(m => m.isCircuitBroken);
  const totalRefetches = metricsArray.reduce((sum, m) => sum + m.refetchCount, 0);
  const successRate =
    totalRefetches > 0
      ? (metricsArray.reduce((sum, m) => sum + m.successCount, 0) / totalRefetches) * 100
      : 100;

  return {
    allMetrics: metricsArray,
    isAnyFailed,
    totalRefetches,
    successRate,
  };
}

/**
 * Hook for intelligent request batching
 * Deduplicates multiple requests for the same data
 * Useful for preventing thundering herd problems
 * 
 * @example
 * ```tsx
 * const { addRequest, executeRequests } = usePollingBatch();
 * 
 * addRequest('metrics', () => metricsQuery.refetch());
 * addRequest('metrics', () => metricsQuery.refetch()); // duplicate, skipped
 * 
 * await executeRequests(); // executes 1 request, not 2
 * ```
 */
export function usePollingBatch() {
  const requestsRef = useRef<Map<string, () => Promise<any>>>(new Map());
  const isExecutingRef = useRef(false);

  const addRequest = useCallback((key: string, request: () => Promise<any>) => {
    // Deduplicate - only add if key doesn't exist
    if (!requestsRef.current.has(key)) {
      requestsRef.current.set(key, request);
    }
  }, []);

  const executeRequests = useCallback(async () => {
    if (isExecutingRef.current || requestsRef.current.size === 0) {
      return;
    }

    isExecutingRef.current = true;

    try {
      const requests = Array.from(requestsRef.current.values());
      await Promise.allSettled(requests.map(fn => fn()));
    } finally {
      requestsRef.current.clear();
      isExecutingRef.current = false;
    }
  }, []);

  const clearRequests = useCallback(() => {
    requestsRef.current.clear();
  }, []);

  return {
    addRequest,
    executeRequests,
    clearRequests,
    pendingCount: requestsRef.current.size,
  };
}
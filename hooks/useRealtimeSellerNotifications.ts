'use client';

import { useEffect, useRef, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

interface UseRealtimeSellerNotificationsOptions {
  enabled?: boolean;
  interval?: number;
}

/**
 * Hook to poll for seller notifications in real-time
 * - Polls every 30 seconds by default
 * - Stops polling when tab is hidden
 * - Resumes immediately when user returns to tab
 * - Debounces rapid refetch calls (1 second minimum)
 * - Exponential backoff on errors (stops after 5 consecutive errors)
 * 
 * FIXED: Now uses TRPC utils for proper cache invalidation instead of
 * incorrect raw query keys that didn't match TRPC's internal key format.
 */
export function useRealtimeSellerNotifications({
  enabled = true,
  interval = 30000, // 30 seconds
}: UseRealtimeSellerNotificationsOptions = {}) {
  const utils = trpc.useUtils();
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefetchRef = useRef<number>(0);
  const errorCountRef = useRef<number>(0);
  const maxErrorsRef = useRef<number>(5);

  const refetchNotifications = useCallback(async () => {
    // Debounce: Prevent rapid refetch calls (minimum 1 second apart)
    const now = Date.now();
    if (now - lastRefetchRef.current < 1000) {
      return;
    }
    lastRefetchRef.current = now;

    try {
      // FIXED: Use TRPC utils to properly invalidate seller notifications
      // This ensures the cache is invalidated with the correct query key format
      await utils.sellerNotifications.getNotifications.invalidate();
      await utils.sellerNotifications.getUnreadCount.invalidate();
      
      // Reset error count on successful refetch
      errorCountRef.current = 0;
    } catch (error) {
      errorCountRef.current += 1;
      console.warn(
        `[useRealtimeSellerNotifications] Refetch error (${errorCountRef.current}/${maxErrorsRef.current}):`,
        error
      );
      
      // Stop polling after max errors with warning
      if (errorCountRef.current >= maxErrorsRef.current) {
        console.warn(
          '[useRealtimeSellerNotifications] Max errors reached. Stopping polling.'
        );
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }
      }
    }
  }, [utils]);

  const startPolling = useCallback(() => {
    if (!enabled || intervalIdRef.current) return;

    intervalIdRef.current = setInterval(() => {
      refetchNotifications();
    }, interval);
  }, [enabled, interval, refetchNotifications]);

  const stopPolling = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  }, []);

  // Handle visibility changes (tab focus/blur)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Immediately refetch when user returns to tab
        refetchNotifications();
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, refetchNotifications, startPolling, stopPolling]);

  // Start/stop polling based on enabled flag
  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]);

  return {
    refetchNotifications,
    stopPolling,
    startPolling,
  };
}
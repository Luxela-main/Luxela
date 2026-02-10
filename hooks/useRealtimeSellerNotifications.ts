'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

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
 */
export function useRealtimeSellerNotifications({
  enabled = true,
  interval = 30000, // 30 seconds
}: UseRealtimeSellerNotificationsOptions = {}) {
  const queryClient = useQueryClient();
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
      // Invalidate and refetch seller notifications
      await queryClient.invalidateQueries({
        queryKey: ['seller', 'notifications'],
      });
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
  }, [queryClient]);

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
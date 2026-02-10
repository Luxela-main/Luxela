'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { buyerQueryKeys } from '@/modules/buyer/queries/queryKeys';

const POLLING_INTERVAL = 30 * 1000; // 30 seconds
const MIN_REFETCH_INTERVAL = 1000; // 1 second minimum between refreshes
const ERROR_THRESHOLD = 5; // Stop after 5 consecutive errors

export function useRealtimeFavorites() {
  const queryClient = useQueryClient();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefetchRef = useRef<number>(0);
  const errorCountRef = useRef<number>(0);
  const isStoppedRef = useRef<boolean>(false);

  useEffect(() => {
    if (isStoppedRef.current) return;

    const startPolling = () => {
      if (isStoppedRef.current) return;

      const poll = async () => {
        try {
          const now = Date.now();
          const timeSinceLastRefetch = now - lastRefetchRef.current;

          // Debounce: ensure minimum interval between refetches
          if (timeSinceLastRefetch < MIN_REFETCH_INTERVAL) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
            }
            pollIntervalRef.current = setTimeout(
              poll,
              MIN_REFETCH_INTERVAL - timeSinceLastRefetch
            );
            return;
          }

          // Invalidate and refetch favorites query
          await queryClient.invalidateQueries({
            queryKey: buyerQueryKeys.favorites(),
          });

          lastRefetchRef.current = now;
          errorCountRef.current = 0; // Reset error count on success
        } catch (error) {
          console.warn('[useRealtimeFavorites] Refetch error:', error);
          errorCountRef.current++;

          if (errorCountRef.current >= ERROR_THRESHOLD) {
            console.warn(
              '[useRealtimeFavorites] Too many errors, stopping polling'
            );
            isStoppedRef.current = true;
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
            }
            return;
          }
        }
      };

      pollIntervalRef.current = setInterval(poll, POLLING_INTERVAL);

      // Initial refetch
      poll();
    };

    // Start polling when page becomes visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      } else {
        // Refresh immediately when returning to page
        if (!isStoppedRef.current) {
          startPolling();
        }
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [queryClient]);
}
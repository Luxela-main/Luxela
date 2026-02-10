'use client';

import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/app/_trpc/client';

interface UseRealtimeCollectionsOptions {
  pollInterval?: number;
  enabled?: boolean;
}

export function useRealtimeCollections(
  options: UseRealtimeCollectionsOptions = {}
) {
  const { pollInterval = 30000, enabled = true } = options;
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingCounterRef = useRef(0);

  // Access the query context
  const utils = trpc.useUtils();

  const startPolling = () => {
    if (isPolling || !enabled) return;

    setIsPolling(true);
    let consecutiveErrors = 0;

    const pollFn = async () => {
      try {
        // Invalidate the collections query to trigger a refetch
        await utils.collection.getApprovedCollections.invalidate();

        // Refetch the data
        await utils.collection.getApprovedCollections.refetch({
          limit: 20,
          offset: 0,
        });

        // Reset error counter on successful poll
        consecutiveErrors = 0;
        pollingCounterRef.current++;

        console.log(
          `[useRealtimeCollections] Poll #${pollingCounterRef.current} completed`
        );
      } catch (error) {
        consecutiveErrors++;
        console.warn(
          `[useRealtimeCollections] Poll error (${consecutiveErrors}/5):`,
          error
        );

        // Stop polling after 5 consecutive errors
        if (consecutiveErrors >= 5) {
          setIsPolling(false);
          console.error(
            '[useRealtimeCollections] Stopping polls after 5 consecutive errors'
          );
          return;
        }
      }

      // Schedule next poll
      pollTimeoutRef.current = setTimeout(pollFn, pollInterval);
    };

    pollFn();
  };

  const stopPolling = () => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    setIsPolling(false);
    console.log('[useRealtimeCollections] Polling stopped');
  };

  // Handle window focus to refresh immediately
  useEffect(() => {
    const handleFocus = () => {
      if (enabled) {
        console.log('[useRealtimeCollections] Window focused, refreshing data');
        utils.collection.getApprovedCollections
          .refetch({ limit: 20, offset: 0 })
          .catch((err) =>
            console.error('[useRealtimeCollections] Refetch on focus failed:', err)
          );
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, utils]);

  // Start polling on mount
  useEffect(() => {
    if (enabled) {
      startPolling();
      return () => {
        stopPolling();
      };
    }
  }, [enabled, pollInterval]);

  return {
    startPolling,
    stopPolling,
    isPolling,
    refreshCollections: () =>
      utils.collection.getApprovedCollections.refetch({ limit: 20, offset: 0 }),
  };
}
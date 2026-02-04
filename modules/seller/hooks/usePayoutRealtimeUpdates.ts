'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sellerQueryKeys } from '../queries/queryKeys';

export interface PayoutRealtimeConfig {
  enabled?: boolean;
  pollIntervalMs?: number;
  includePayoutMethods?: boolean;
}

export const usePayoutRealtimeUpdates = (config: PayoutRealtimeConfig = {}) => {
  const { enabled = true, pollIntervalMs = 30000, includePayoutMethods = true } = config; // 30 seconds default
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const pollPayoutUpdates = useCallback(() => {
    console.log('[Payout Updates] Polling for updates');
    
    // Invalidate payout-related queries to trigger fresh data fetch
    queryClient.invalidateQueries({
      queryKey: sellerQueryKeys.payoutStats(),
    });
    queryClient.invalidateQueries({
      queryKey: sellerQueryKeys.payoutHistory(),
    });
    
    // Include payout methods in real-time updates if enabled
    if (includePayoutMethods) {
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.payoutMethods(),
      });
    }
  }, [queryClient, includePayoutMethods]);

  // Set up polling for payout updates (compatible with Vercel serverless)
  useEffect(() => {
    if (!enabled) {
      setIsConnected(false);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      return;
    }

    setIsConnected(true);
    console.log('[Payout Updates] Polling started (interval:', pollIntervalMs, 'ms)');

    // Do initial poll
    pollPayoutUpdates();

    // Set up interval for subsequent polls
    pollIntervalRef.current = setInterval(pollPayoutUpdates, pollIntervalMs);

    return () => {
      setIsConnected(false);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [enabled, pollIntervalMs, pollPayoutUpdates]);

  return {
    isConnected,
  };
};
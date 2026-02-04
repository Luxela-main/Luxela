'use client';

import { useEffect, useState } from 'react';
import { usePayoutMethods } from '../queries/usePayoutMethods';
import { usePayoutRealtimeUpdates } from './usePayoutRealtimeUpdates';

/**
 * Hook that provides real-time payout methods with automatic polling and sync.
 * This hook combines usePayoutMethods query with real-time updates to ensure
 * the payment settings on the Account page always reflect the latest data from
 * the Payout Methods page.
 */
export const usePayoutMethodsRealtime = (options?: {
  pollIntervalMs?: number;
  enabled?: boolean;
  onDataChange?: (methods: any[]) => void;
}) => {
  const {
    pollIntervalMs = 30000,
    enabled = true,
    onDataChange,
  } = options || {};

  // Fetch payout methods using the standard query
  const {
    data: payoutMethods = [],
    isLoading,
    error,
    refetch,
  } = usePayoutMethods();

  // Enable real-time polling for payout methods
  const { isConnected } = usePayoutRealtimeUpdates({
    enabled,
    pollIntervalMs,
    includePayoutMethods: true,
  });

  // Call callback when data changes
  useEffect(() => {
    if (onDataChange && payoutMethods.length > 0) {
      onDataChange(payoutMethods);
    }
  }, [payoutMethods, onDataChange]);

  return {
    payoutMethods,
    isLoading,
    error,
    refetch,
    isLiveUpdating: isConnected && enabled,
  };
};
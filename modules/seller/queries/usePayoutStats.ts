import { useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { sellerQueryKeys } from './queryKeys';

export const usePayoutStats = () => {
  const queryClient = useQueryClient();
  
  const query = trpc.finance.getPayoutStats.useQuery(undefined, {
    staleTime: 5 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 10 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 15000),
  });

  useEffect(() => {
    if (!query.data) return;

    const refreshInterval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.payoutStats(),
      });
    }, 10 * 1000);

    return () => clearInterval(refreshInterval);
  }, [query.data, queryClient]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        queryClient.invalidateQueries({
          queryKey: sellerQueryKeys.payoutStats(),
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient]);

  return {
    ...query,
    refetch: query.refetch,
  };
};

export const usePayoutHistory = (filters?: { month?: string; year?: number }) => {
  const queryClient = useQueryClient();
  
  const queryInput = useMemo(
    () => ({
      month: filters?.month,
      year: filters?.year,
    }),
    [filters?.month, filters?.year]
  );

  const query = trpc.finance.getPayoutHistory.useQuery(queryInput, {
    staleTime: 5 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 10 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 15000),
  });

  useEffect(() => {
    if (!query.data || query.data.length === 0) return;

    const refreshInterval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.payoutHistory(filters?.month, filters?.year),
      });
    }, 10 * 1000);

    return () => clearInterval(refreshInterval);
  }, [query.data, filters?.month, filters?.year, queryClient]);
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        queryClient.invalidateQueries({
          queryKey: sellerQueryKeys.payoutHistory(filters?.month, filters?.year),
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [filters?.month, filters?.year, queryClient]);

  return {
    ...query,
    refetch: query.refetch,
  };
};
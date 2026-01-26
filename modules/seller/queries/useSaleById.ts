import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getTRPCClient } from '@/lib/trpc';
import { sellerQueryKeys } from './queryKeys';

export const useSaleById = (orderId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: sellerQueryKeys.sale(orderId),
    queryFn: async () => {
      const client: any = getTRPCClient();
      const result = await ((client.sales as any).getSaleById as any).query({
        orderId: orderId as any,
      });
      return result;
    },
    enabled: Boolean(orderId && orderId.trim()),
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 2000,
    gcTime: 1000 * 60 * 5,
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  useEffect(() => {
    if (!orderId || orderId.trim() === '' || !query.data) return;

    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.sale(orderId),
      });
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [orderId, query.data, queryClient]);

  return {
    ...query,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
};
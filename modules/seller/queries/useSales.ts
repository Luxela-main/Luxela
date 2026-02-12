import { useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTRPCClient } from '@/lib/trpc';
import { sellerQueryKeys } from './queryKeys';

export interface Sale {
  id: string | null | undefined;
  orderId: string;
  product: string;
  customer: string;
  orderDate: Date;
  paymentMethod: string;
  amountCents: number;
  currency: string;
  payoutStatus: string;
  deliveryStatus: string;
  orderStatus: string;
}

const REFETCH_INTERVALS = {
  ACTIVE: 5000,
  PENDING: 15000,
  COMPLETED: 60000,
  LONG: 300000,
};

export const useSales = (status?: string) => {
  const queryClient = useQueryClient();

  // Determine refetch interval based on order status
  const getRefetchInterval = (data?: Sale[]) => {
    if (!data || data.length === 0) return REFETCH_INTERVALS.LONG;

    const hasActive = data.some((order) =>
      ['processing', 'shipped', 'in_transit'].includes(order.orderStatus)
    );
    const hasPending = data.some((order) =>
      ['pending', 'confirmed'].includes(order.orderStatus)
    );

    if (hasActive) return REFETCH_INTERVALS.ACTIVE;
    if (hasPending) return REFETCH_INTERVALS.PENDING;
    return REFETCH_INTERVALS.COMPLETED;
  };

  const query = useQuery({
    queryKey: sellerQueryKeys.sales(status),
    queryFn: async () => {
      const client = getTRPCClient();
      const result = await ((client.sales as any).getAllSales as any).query({
        status: status as any,
      });
      return result as Sale[];
    },
    refetchInterval: (query) => getRefetchInterval(query.state.data),
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 3000,
    gcTime: 1000 * 60 * 10,
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  useEffect(() => {
    if (!query.data) return;

    // Set up interval-based polling for real-time updates
    const client = getTRPCClient();
    const unsubscribe = ((client.sales as any).getAllSales as any).query
      .subscribe?.({
        status: status as any,
      })
      ?.subscribe((data: Sale[]) => {
        queryClient.setQueryData(sellerQueryKeys.sales(status), data);
      });

    return () => {
      unsubscribe?.();
    };
  }, [status, queryClient, query.data]);

  const refetch = async () => {
    return queryClient.invalidateQueries({
      queryKey: sellerQueryKeys.sales(status),
    });
  };

  return {
    ...query,
    refetch,
    isFetching: query.isFetching,
    isRefetching: query.isRefetching,
  };
};

export const prefetchSales = async (status?: string) => {
  const queryClient = useQueryClient();

  return queryClient.prefetchQuery({
    queryKey: sellerQueryKeys.sales(status),
    queryFn: async () => {
      const client = getTRPCClient();
      const result = await ((client.sales as any).getAllSales as any).query({
        status: status as any,
      });
      return result as Sale[];
    },
    staleTime: 3000,
  });
};
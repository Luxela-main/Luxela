'use client';

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { sellerQueryKeys } from './queryKeys';

export interface PendingOrder {
  id: string;
  orderId: string;
  sellerId: string;
  buyerId: string;
  listingId: string;
  productTitle: string;
  productImage?: string;
  productCategory: string;
  quantity: number;
  amountCents: number;
  currency: string;
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'canceled';
  deliveryStatus: 'not_shipped' | 'in_transit' | 'delivered' | 'delayed' | 'returned';
  payoutStatus: 'pending' | 'held' | 'released' | 'paid' | 'failed';
  paymentMethod: string;
  buyerName: string;
  buyerEmail: string;
  shippingAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PendingOrdersFilters {
  status?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

export function usePendingOrders(
  filters?: PendingOrdersFilters,
  options?: Omit<UseQueryOptions<PendingOrder[], Error>, 'queryKey' | 'queryFn'>
) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: sellerQueryKeys.pendingOrders(filters?.limit, filters?.offset),
    queryFn: async () => {
      try {
        // Get current seller from the trpc context
        const userResult = await (trpc.seller.getProfile as any).query() as any;
        const sellerId = userResult?.seller?.id;
        
        if (!sellerId) {
          throw new Error('User not authenticated');
        }

        const result = await (trpc.orderStatus.getPendingOrders as any).query({
          sellerId,
          limit: filters?.limit || 50,
          offset: filters?.offset || 0,
        });
        // Extract orders array from response
        return result?.orders || [] as PendingOrder[];
      } catch (err) {
        throw err;
      }
    },
    staleTime: 3 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 5 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
    ...options,
  });

  useEffect(() => {
    if (!query.data || query.data.length === 0) return;

    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.pendingOrders(filters?.limit, filters?.offset),
      });
    }, 5 * 1000);

    return () => clearInterval(pollInterval);
  }, [query.data, filters?.limit, filters?.offset, queryClient]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        queryClient.invalidateQueries({
          queryKey: sellerQueryKeys.pendingOrders(filters?.limit, filters?.offset),
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [filters?.limit, filters?.offset, queryClient]);

  return {
    ...query,
    refetch: query.refetch,
  };
}

export function useOrdersByStatus(
  status: string,
  filters?: { limit?: number; offset?: number },
  options?: Omit<UseQueryOptions<PendingOrder[], Error>, 'queryKey' | 'queryFn'>
) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: sellerQueryKeys.ordersByStatus(status, filters?.limit, filters?.offset),
    queryFn: async () => {
      try {
        const result = await ((trpc.orderStatus.getOrdersByStatus as any).query)({
          status,
          limit: filters?.limit || 20,
          offset: filters?.offset || 0,
        });
        return result as PendingOrder[];
      } catch (err) {
        throw err;
      }
    },
    enabled: !!status,
    staleTime: 3 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 5 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: 'always',
    retry: 2,
    ...options,
  });

  useEffect(() => {
    if (!query.data || query.data.length === 0 || !status) return;

    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.ordersByStatus(status, filters?.limit, filters?.offset),
      });
    }, 5 * 1000);

    return () => clearInterval(pollInterval);
  }, [query.data, status, filters?.limit, filters?.offset, queryClient]);

  return query;
}

export function useOrderById(
  orderId: string,
  options?: Omit<UseQueryOptions<PendingOrder, Error>, 'queryKey' | 'queryFn'>
) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: sellerQueryKeys.orderById(orderId),
    queryFn: async () => {
      try {
        const result = await ((trpc.orderStatus.getOrderById as any).query)({ orderId });
        return result as PendingOrder;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!orderId,
    staleTime: 2 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 3 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 2,
    ...options,
  });

  useEffect(() => {
    if (!query.data || !orderId) return;

    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.orderById(orderId),
      });
    }, 3 * 1000);

    return () => clearInterval(pollInterval);
  }, [query.data, orderId, queryClient]);

  return query;
}

export function useOrderStats(
  dateRange?: { startDate?: Date; endDate?: Date },
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: sellerQueryKeys.orderStats(dateRange?.startDate, dateRange?.endDate),
    queryFn: async () => {
      try {
        const result = await ((trpc.orderStatus.getOrderStats as any).query)(
          dateRange || {}
        );
        return result;
      } catch (err) {
        throw err;
      }
    },
    staleTime: 10 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 2,
    ...options,
  });

  useEffect(() => {
    if (!query.data) return;

    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.orderStats(dateRange?.startDate, dateRange?.endDate),
      });
    }, 30 * 1000);

    return () => clearInterval(pollInterval);
  }, [query.data, dateRange?.startDate, dateRange?.endDate, queryClient]);

  return query;
}

export function useConfirmOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { orderId: string }) => 
      await ((trpc.orderStatus.confirmOrder as any).mutate)(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.pendingOrders(),
      });
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.orders(),
      });
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.orderStats(),
      });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { orderId: string; reason?: string }) => 
      await ((trpc.orderStatus.cancelOrder as any).mutate)(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.pendingOrders(),
      });
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.orders(),
      });
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.orderStats(),
      });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { orderId: string; status: string }) => 
      await ((trpc.orderStatus.updateOrderStatus as any).mutate)(data),
    onSuccess: (data: PendingOrder) => {
      queryClient.setQueryData(
        sellerQueryKeys.orderById(data.orderId),
        data
      );
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.orders(),
      });
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.orderStats(),
      });
    },
  });
}

export function useShipOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { orderId: string; trackingNumber?: string }) => 
      await ((trpc.orderStatus.shipOrder as any).mutate)(data),
    onSuccess: (data: PendingOrder) => {
      queryClient.setQueryData(
        sellerQueryKeys.orderById(data.orderId),
        data
      );
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.orders(),
      });
    },
  });
}

export async function prefetchPendingOrders(
  queryClient: any,
  filters?: PendingOrdersFilters
) {
  await queryClient.prefetchQuery({
    queryKey: sellerQueryKeys.pendingOrders(filters?.limit, filters?.offset),
    queryFn: async () => {
      return await ((trpc.orderStatus.getPendingOrders as any).query)(filters || {});
    },
  });
}
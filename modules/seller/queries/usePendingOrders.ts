'use client';

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { getTRPCClient } from '@/lib/trpc';
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

// First get the seller profile to get sellerId
function useSellerProfile() {
  return useQuery({
    queryKey: sellerQueryKeys.sellerProfile(),
    queryFn: async () => {
      try {
        const client = getTRPCClient();
        const result = await ((client.seller as any).getProfile as any).query();
        // The response contains { seller, business, shipping, payment, additional }
        if (!result || !result.seller) {
          throw new Error('No seller profile found');
        }
        return result.seller;
      } catch (err) {
        console.error('Failed to fetch seller profile:', err);
        throw err;
      }
    },
    staleTime: 60 * 1000, // Cache for 1 minute
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}

export function usePendingOrders(
  filters?: PendingOrdersFilters,
  options?: Omit<UseQueryOptions<PendingOrder[], Error>, 'queryKey' | 'queryFn'>
) {
  const queryClient = useQueryClient();
  
  // Get seller profile first
  const { data: sellerProfile, isLoading: isLoadingProfile, error: profileError } = useSellerProfile();
  const sellerId = useMemo(() => sellerProfile?.id, [sellerProfile?.id]);
  
  const query = useQuery({
    queryKey: sellerQueryKeys.pendingOrders(filters?.limit, filters?.offset),
    queryFn: async () => {
      if (!sellerId) {
        throw new Error('Seller ID not available. Please ensure you are logged in as a seller.');
      }
      
      try {
        const client = getTRPCClient();
        const result = await ((client.orderStatus as any).getPendingOrders as any).query({
          sellerId,
          limit: filters?.limit || 50,
          offset: filters?.offset || 0,
        });
        // Extract orders array from response
        const orders = result?.orders || [];
        if (!Array.isArray(orders)) {
          console.warn('Unexpected response format from getPendingOrders:', result);
          return [];
        }
        return orders as PendingOrder[];
      } catch (err) {
        console.error('Failed to fetch pending orders:', err);
        throw err;
      }
    },
    enabled: !!sellerId && !isLoadingProfile && !profileError,
    staleTime: 30 * 1000, // 30 seconds cache
    gcTime: 15 * 60 * 1000, // 15 minute garbage collection
    refetchInterval: undefined, // No automatic polling
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false, // Only on explicit user action
    refetchOnReconnect: true,
    refetchOnMount: false,
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
    ...options,
  });

  // Only refetch when page becomes visible
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

  // If there's a profile error, bubble it up
  const error = profileError || query.error;
  
  return {
    ...query,
    error,
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
        const client = getTRPCClient();
        const result = await ((client.orderStatus as any).getOrdersByStatus as any).query({
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
    staleTime: 30 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchInterval: undefined,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });

  return query;
}

export function useOrderById(
  orderId: string,
  options?: Omit<UseQueryOptions<PendingOrder, Error>, 'queryKey' | 'queryFn'>
) {
  const query = useQuery({
    queryKey: sellerQueryKeys.orderById(orderId),
    queryFn: async () => {
      try {
        const client = getTRPCClient();
        const result = await ((client.orderStatus as any).getOrderById as any).query({ orderId });
        return result as PendingOrder;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!orderId,
    staleTime: 10 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchInterval: undefined,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });

  return query;
}

export function useOrderStats(
  dateRange?: { startDate?: Date; endDate?: Date },
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  const query = useQuery({
    queryKey: sellerQueryKeys.orderStats(dateRange?.startDate, dateRange?.endDate),
    queryFn: async () => {
      try {
        const client = getTRPCClient();
        const result = await ((client.orderStatus as any).getOrderStats as any).query(
          dateRange || {}
        );
        return result;
      } catch (err) {
        throw err;
      }
    },
    staleTime: 30 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchInterval: undefined,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });

  return query;
}

export function useConfirmOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { orderId: string }) => {
      const client = getTRPCClient();
      return await ((client.orderStatus as any).confirmOrder as any).mutate(data);
    },
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
    mutationFn: async (data: { orderId: string; reason?: string }) => {
      const client = getTRPCClient();
      return await ((client.orderStatus as any).cancelOrder as any).mutate(data);
    },
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
    mutationFn: async (data: { orderId: string; status: string }) => {
      const client = getTRPCClient();
      return await ((client.orderStatus as any).updateOrderStatus as any).mutate(data);
    },
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
    mutationFn: async (data: { orderId: string; trackingNumber?: string }) => {
      const client = getTRPCClient();
      return await ((client.orderStatus as any).shipOrder as any).mutate(data);
    },
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
      const client = getTRPCClient();
      return await ((client.orderStatus as any).getPendingOrders as any).query(filters || {});
    },
  });
}
'use client';

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { sellerQueryKeys } from './queryKeys';

/**
 * Order interface matching the seller's order structure
 */
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

/**
 * Filter options for pending orders query
 */
export interface PendingOrdersFilters {
  status?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * Hook to fetch pending orders for a seller
 * Supports filtering by status and pagination
 *
 * @param filters - Filter options (status, limit, offset)
 * @param options - React Query options
 * @returns Query result with pending orders data
 *
 * @example
 * const { data, isLoading, error } = usePendingOrders({
 *   status: 'pending',
 *   limit: 20,
 *   offset: 0
 * });
 */
export function usePendingOrders(
  filters?: PendingOrdersFilters,
  options?: Omit<UseQueryOptions<PendingOrder[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: sellerQueryKeys.pendingOrders(filters?.limit, filters?.offset),
    queryFn: async () => {
      try {
        const result = await (trpc.orderStatus.getPendingOrders as any).query(
          filters || {}
        );
        return result as any;
      } catch (err) {
        throw err;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    ...options,
  });
}

/**
 * Hook to fetch orders by specific status
 * Supports all order statuses with pagination
 *
 * @param status - Order status to filter by
 * @param filters - Pagination options
 * @param options - React Query options
 * @returns Query result with orders matching the status
 */
export function useOrdersByStatus(
  status: string,
  filters?: { limit?: number; offset?: number },
  options?: Omit<UseQueryOptions<PendingOrder[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
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
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch a single order by ID
 *
 * @param orderId - The order ID to fetch
 * @param options - React Query options
 * @returns Query result with the order data
 */
export function useOrderById(
  orderId: string,
  options?: Omit<UseQueryOptions<PendingOrder, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
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
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch order statistics
 * Includes counts by status, revenue data, etc.
 *
 * @param dateRange - Optional date range for stats
 * @param options - React Query options
 * @returns Query result with order statistics
 */
export function useOrderStats(
  dateRange?: { startDate?: Date; endDate?: Date },
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Hook to confirm a pending order
 * Confirms the order and transitions it to processing
 *
 * @returns Mutation function and state
 *
 * @example
 * const { mutate, isPending } = useConfirmOrder();
 * mutate({ orderId: '123' });
 */
export function useConfirmOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { orderId: string }) => 
      await ((trpc.orderStatus.confirmOrder as any).mutate)(data),
    onSuccess: () => {
      // Invalidate related queries to refresh data
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

/**
 * Hook to cancel an order
 * Cancels the order with an optional reason
 *
 * @returns Mutation function and state
 *
 * @example
 * const { mutate, isPending } = useCancelOrder();
 * mutate({ orderId: '123', reason: 'out_of_stock' });
 */
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

/**
 * Hook to update order status
 * Transitions order to next status (confirmed, shipped, delivered, etc.)
 *
 * @returns Mutation function and state
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { orderId: string; status: string }) => 
      await ((trpc.orderStatus.updateOrderStatus as any).mutate)(data),
    onSuccess: (data: PendingOrder) => {
      // Update specific order cache
      queryClient.setQueryData(
        sellerQueryKeys.orderById(data.orderId),
        data
      );
      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.orders(),
      });
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.orderStats(),
      });
    },
  });
}

/**
 * Hook to ship an order
 * Updates order status to 'shipped' and initiates delivery tracking
 *
 * @returns Mutation function and state
 */
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

/**
 * Prefetch pending orders for better performance
 * Call this before rendering the pending orders page
 *
 * @example
 * const queryClient = useQueryClient();
 * prefetchPendingOrders(queryClient, { limit: 20 });
 */
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
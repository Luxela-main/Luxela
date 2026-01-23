import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getVanillaTRPCClient } from '@/lib/trpc';
import { toastSvc } from '@/services/toast';
import { orderKeys } from './queryKeys';

const trpc = getVanillaTRPCClient();

export function useOrderStatus(orderId: string) {
  return useQuery({
    queryKey: orderKeys.status(orderId),
    queryFn: async () => {
      return await ((trpc.orderStatus as any).getOrderStatus as any).query({ orderId });
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
    enabled: !!orderId,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: {
      orderId: string;
      newStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'canceled';
      trackingNumber?: string;
      estimatedDelivery?: Date;
      notes?: string;
    }) => {
      return await (trpc.orderStatus as any).updateOrderStatus.mutate(input);
    },
    onSuccess: (data, variables) => {
      toastSvc.success(`Order status updated to ${data.newStatus}`);
      
      // Invalidate affected queries
      queryClient.invalidateQueries({
        queryKey: orderKeys.status(variables.orderId),
      });
      queryClient.invalidateQueries({
        queryKey: orderKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: orderKeys.byStatus(data.newStatus),
      });
    },
    onError: (error: any) => {
      toastSvc.error(error?.message || 'Failed to update order status');
    },
  });
}

export function useConfirmOrderReceipt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: {
      orderId: string;
      itemsReceived: string[];
      condition?: 'excellent' | 'good' | 'acceptable' | 'damaged';
      notes?: string;
    }) => {
      return await (trpc.orderStatus as any).confirmOrderReceipt.mutate(input);
    },
    onSuccess: (data, variables) => {
      toastSvc.success('Order receipt confirmed. Thank you for your purchase!');
      
      queryClient.invalidateQueries({
        queryKey: orderKeys.status(variables.orderId),
      });
      queryClient.invalidateQueries({
        queryKey: orderKeys.all,
      });
    },
    onError: (error: any) => {
      toastSvc.error(error?.message || 'Failed to confirm receipt');
    },
  });
}

export function useOrderTracking(orderId: string) {
  return useQuery({
    queryKey: orderKeys.tracking(orderId),
    queryFn: async () => {
      return await ((trpc.orderStatus as any).getOrderTracking as any).query({ orderId });
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    enabled: !!orderId,
  });
}

export function useOrdersByStatus(status: string, limit = 50, offset = 0) {
  return useQuery({
    queryKey: orderKeys.byStatus(status, limit, offset),
    queryFn: async () => {
      return await ((trpc.orderStatus as any).getOrdersByStatus as any).query({
        status: status as any,
        limit,
        offset,
      });
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useOrderStats(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: orderKeys.stats(startDate, endDate),
    queryFn: async () => {
      return await ((trpc.buyer as any).getOrderStats as any).query({
        startDate,
        endDate,
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useOrderHistory(orderId: string) {
  return useQuery({
    queryKey: orderKeys.history(orderId),
    queryFn: async () => {
      return await ((trpc.orderStatus as any).getStatusHistory as any).query({ orderId });
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!orderId,
  });
}

// Seller hooks
export function useSellerOrdersByStatus(status: string, limit = 50, offset = 0) {
  return useQuery({
    queryKey: [...orderKeys.byStatus(status, limit, offset), 'seller'],
    queryFn: async () => {
      return await ((trpc.orderStatus as any).getOrdersByStatus as any).query({
        status: status as any,
        limit,
        offset,
      });
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useSellerOrderStats(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: [...orderKeys.stats(startDate, endDate), 'seller'],
    queryFn: async () => {
      return await (trpc.buyer as any).getOrderStats.query({
        startDate,
        endDate,
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePendingOrders(limit = 50, offset = 0) {
  return useOrdersByStatus('pending', limit, offset);
}

export function useProcessingOrders(limit = 50, offset = 0) {
  return useOrdersByStatus('processing', limit, offset);
}

export function useShippedOrders(limit = 50, offset = 0) {
  return useOrdersByStatus('shipped', limit, offset);
}

export function useDeliveredOrders(limit = 50, offset = 0) {
  return useOrdersByStatus('delivered', limit, offset);
}

export function useCompletedOrders(limit = 50, offset = 0) {
  return useOrdersByStatus('completed', limit, offset);
}
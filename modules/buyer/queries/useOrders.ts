"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { buyerQueryKeys } from "./queryKeys";

export interface UseOrdersConfig {
  status?: string;
  limit?: number;
  offset?: number;
  enablePolling?: boolean;
  pollingInterval?: number; // in milliseconds, default 30000 (30 seconds)
}

export function useOrders(filters: UseOrdersConfig = {}) {
  const { enablePolling = false, pollingInterval = 30000, ...queryFilters } = filters;
  
  return useQuery({
    queryKey: buyerQueryKeys.orders(),
    queryFn: async () => {
      try {
        const result = await ((trpc.buyer as any).getOrders as any).query(queryFilters || {});
        return result;
      } catch (err) {
        throw err;
      }
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: enablePolling ? pollingInterval : undefined,
    refetchIntervalInBackground: enablePolling,
  });
}

export interface UseOrderByIdConfig {
  enablePolling?: boolean;
  pollingInterval?: number; // default 30000 (30 seconds)
}

export function useOrderById(orderId: string, config: UseOrderByIdConfig = {}) {
  const { enablePolling = false, pollingInterval = 30000 } = config;
  
  return useQuery({
    queryKey: buyerQueryKeys.orderById(orderId),
    queryFn: async () => {
      try {
        const result = await ((trpc.buyer as any).getOrderById as any).query({ orderId });
        return result;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!orderId,
    staleTime: 60 * 1000,
    refetchInterval: enablePolling ? pollingInterval : undefined,
    refetchIntervalInBackground: enablePolling,
  });
}

export interface UseOrderStatsConfig {
  enablePolling?: boolean;
  pollingInterval?: number; // default 30000 (30 seconds)
}

export function useOrderStats(config: UseOrderStatsConfig = {}) {
  const { enablePolling = false, pollingInterval = 30000 } = config;
  
  return useQuery({
    queryKey: buyerQueryKeys.orderStats(),
    queryFn: async () => {
      try {
        const result = await ((trpc.buyer as any).getOrderStats as any).query();
        return result;
      } catch (err) {
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: enablePolling ? pollingInterval : undefined,
    refetchIntervalInBackground: enablePolling,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return (trpc.buyer as any).cancelOrder.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buyerQueryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: buyerQueryKeys.orderStats() });
    },
  });
}

export function useReturnOrder() {
  const queryClient = useQueryClient();

  return (trpc.buyer as any).returnOrder.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buyerQueryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: buyerQueryKeys.orderStats() });
    },
  });
}
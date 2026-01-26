import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sellersKeys } from "./queryKeys";
import { toastSvc } from "@/services/toast";
import { Sale } from "../model/sales";
import { getVanillaTRPCClient } from "@/lib/trpc";

export const usePendingOrders = (params?: { status?: string; limit?: number; offset?: number }, options?: any) => {
  return useQuery<Sale[]>({
    queryKey: sellersKeys.sales("pending"),
    queryFn: async () => {
      const client: any = getVanillaTRPCClient();
      return await ((client.sales as any).getAllSales as any).query({
        status: "pending",
        ...params,
      });
    },
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 30,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
};

export const useConfirmOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      const client: any = getVanillaTRPCClient();
      return await client.sales.confirmOrder.mutate({ orderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellersKeys.sales() });
      queryClient.invalidateQueries({ queryKey: sellersKeys.sales("pending") });
      toastSvc.success("Order confirmed successfully");
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      reason,
    }: {
      orderId: string;
      reason?: string;
    }) => {
      const client: any = getVanillaTRPCClient();
      return await client.sales.cancelOrder.mutate({ orderId, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellersKeys.sales() });
      queryClient.invalidateQueries({ queryKey: sellersKeys.sales("pending") });
      toastSvc.success("Order cancelled successfully");
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
};
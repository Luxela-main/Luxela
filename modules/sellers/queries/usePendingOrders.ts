import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sellersKeys } from "./queryKeys";
import { toastSvc } from "@/services/toast";
import { Sale } from "../model/sales";
import { getVanillaTRPCClient } from "@/lib/trpc";

export const usePendingOrders = () => {
  return useQuery<Sale[]>({
    queryKey: sellersKeys.sales("pending"),
    queryFn: async () => {
      const client: any = getVanillaTRPCClient();
      return await ((client.sales as any).getAllSales as any).query({ status: "pending" });
    },
    staleTime: 1 * 60 * 1000, // 1 minute
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
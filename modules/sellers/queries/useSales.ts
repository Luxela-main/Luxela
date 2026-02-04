import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sellersKeys } from "./queryKeys";
import { toastSvc } from "@/services/toast";
import { Sale } from "../model/sales";
import { getTRPCClient } from "@/lib/trpc";

export const useSales = (status?: string) => {
  return useQuery<Sale[]>({
    queryKey: sellersKeys.sales(status),
    queryFn: async () => {
      const client: any = getTRPCClient();
      return await ((client.sales as any).getAllSales as any).query(status ? { status } : {});
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: undefined, // Disable auto-refetch
    refetchOnWindowFocus: false, // Disable window focus refetch
  });
};

export const useSaleById = (orderId: string) => {
  return useQuery<Sale>({
    queryKey: [...sellersKeys.sales(), orderId],
    queryFn: async () => {
      const client: any = getTRPCClient();
      return await ((client.sales as any).getSaleById as any).query({ orderId });
    },
    enabled: !!orderId,
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      payoutStatus,
      deliveryStatus,
      orderStatus,
    }: {
      orderId: string;
      payoutStatus?: string;
      deliveryStatus?: string;
      orderStatus?: string;
    }) => {
      const client: any = getTRPCClient();
      return await client.sales.updateSale.mutate({
        orderId,
        payoutStatus,
        deliveryStatus,
        orderStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellersKeys.sales() });
      toastSvc.success("Order status updated successfully");
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
};
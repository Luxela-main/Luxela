import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sellersKeys } from "./queryKeys";
import { toastSvc } from "@/services/toast";
import { Sale } from "../model/sales";
import { trpc } from "@/lib/trpc";

export type OrderStatus = "all" | "pending" | "processing" | "shipped" | "delivered" | "canceled" | "returned";

export type PayoutStatus = "in_escrow" | "processing" | "paid";
export type DeliveryStatus = "not_shipped" | "in_transit" | "delivered";
export type UpdateOrderStatus = "processing" | "shipped" | "delivered" | "canceled" | "returned";

export const useSales = (status?: OrderStatus) => {
  return trpc.sales.getAllSales.useQuery(
    status ? { status } : {},
    {
      staleTime: 30 * 1000, 
      gcTime: 10 * 60 * 1000, 
      refetchInterval: 30 * 1000,
      refetchOnWindowFocus: true,
    }
  );
};

export const useSaleById = (orderId: string) => {
  const query = trpc.sales.getSaleById.useQuery(
    { orderId },
    {
      enabled: !!orderId && orderId.trim() !== '',
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );

  // Enhanced error logging for debugging
  if (query.error) {
    const errorMsg = (query.error as any)?.message || 'Unknown error';
    const errorCode = (query.error as any)?.code || 'UNKNOWN';
    console.error('[useSaleById] Query failed:', {
      orderId,
      error: errorMsg,
      code: errorCode,
      fullError: query.error,
      timestamp: new Date().toISOString(),
    });
  }

  return query;
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  const updateMutation = trpc.sales.updateSale.useMutation();

  return useMutation({
    mutationFn: async ({
      orderId,
      payoutStatus,
      deliveryStatus,
      orderStatus,
    }: {
      orderId: string;
      payoutStatus?: PayoutStatus;
      deliveryStatus?: DeliveryStatus;
      orderStatus?: UpdateOrderStatus;
    }) => {
      // Validate status enum values before sending
      const validPayoutStatuses = ['in_escrow', 'processing', 'paid'];
      const validDeliveryStatuses = ['not_shipped', 'in_transit', 'delivered'];
      const validOrderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'canceled', 'returned'];
      
      if (payoutStatus && !validPayoutStatuses.includes(payoutStatus)) {
        throw new Error(`Invalid payout status: ${payoutStatus}`);
      }
      if (deliveryStatus && !validDeliveryStatuses.includes(deliveryStatus)) {
        throw new Error(`Invalid delivery status: ${deliveryStatus}`);
      }
      if (orderStatus && !validOrderStatuses.includes(orderStatus)) {
        throw new Error(`Invalid order status: ${orderStatus}`);
      }
      
      return await updateMutation.mutateAsync({
        orderId,
        payoutStatus: payoutStatus as PayoutStatus | undefined,
        deliveryStatus: deliveryStatus as DeliveryStatus | undefined,
        orderStatus: orderStatus as UpdateOrderStatus | undefined,
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
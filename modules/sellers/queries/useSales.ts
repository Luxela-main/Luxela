import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { sellersKeys } from './queryKeys';
import { toastSvc } from '@/services/toast';

export interface Sale {
  orderId: string;
  product: string;
  customer: string;
  orderDate: Date;
  paymentMethod: string;
  amountCents: number;
  currency: string;
  payoutStatus: 'in_escrow' | 'processing' | 'paid';
  deliveryStatus: 'not_shipped' | 'in_transit' | 'delivered';
  orderStatus: 'processing' | 'shipped' | 'delivered' | 'canceled' | 'returned';
}

export const useSales = (status?: string) => {
  return useQuery<Sale[]>({
    queryKey: sellersKeys.sales(status),
    queryFn: async () => {
      const params = status ? `?status=${encodeURIComponent(status)}` : '';
      const response = await api.get(`/sales${params}`);
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useSaleById = (orderId: string) => {
  return useQuery<Sale>({
    queryKey: [...sellersKeys.sales(), orderId],
    queryFn: async () => {
      const response = await api.get(`/sales/${orderId}`);
      return response.data;
    },
    enabled: !!orderId,
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await api.put(`/sales/${orderId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellersKeys.sales() });
      toastSvc.success('Order status updated successfully');
    },
    onError: (error) => {
      toastSvc.apiError(error);
    },
  });
};

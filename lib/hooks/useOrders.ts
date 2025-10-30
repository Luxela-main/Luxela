import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toastSvc } from '@/services/toast';

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  productTitle: string;
  productCategory: string;
  customerName: string;
  customerEmail: string;
  orderDate: Date;
  paymentMethod: string;
  amountCents: number;
  currency: string;
  payoutStatus: 'in_escrow' | 'processing' | 'paid';
  deliveryStatus: 'not_shipped' | 'in_transit' | 'delivered';
  orderStatus: 'processing' | 'shipped' | 'delivered' | 'canceled' | 'returned';
  shippingAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

export const useOrders = (filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: async (): Promise<Order[]> => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());
      
      const response = await api.get(`/orders?${params.toString()}`);
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async (): Promise<Order> => {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderData: Partial<Order>) => {
      const response = await api.post('/orders', orderData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toastSvc.success('Order created successfully');
    },
    onError: (error) => {
      toastSvc.apiError(error);
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.put(`/orders/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toastSvc.success('Order status updated');
    },
    onError: (error) => {
      toastSvc.apiError(error);
    },
  });
};

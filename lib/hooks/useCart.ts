import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toastSvc } from '@/services/toast';

export interface CartItem {
  id: string;
  cartId: string;
  listingId: string;
  quantity: number;
  unitPriceCents: number;
  currency: string;
  product: {
    id: string;
    title: string;
    image: string;
  };
}

export interface Cart {
  id: string;
  buyerId: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  discount?: {
    id: string;
    code: string;
    percentOff?: number;
    amountOffCents?: number;
  };
}

export const useCart = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: async (): Promise<Cart> => {
      const response = await api.get('/cart');
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ listingId, quantity }: { listingId: string; quantity: number }) => {
      const response = await api.post('/cart/items', { listingId, quantity });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toastSvc.success('Added to cart');
    },
    onError: (error) => {
      toastSvc.apiError(error);
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ listingId, quantity }: { listingId: string; quantity: number }) => {
      const response = await api.put(`/cart/items/${listingId}`, { quantity });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => {
      toastSvc.apiError(error);
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (listingId: string) => {
      const response = await api.delete(`/cart/items/${listingId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toastSvc.success('Removed from cart');
    },
    onError: (error) => {
      toastSvc.apiError(error);
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await api.delete('/cart');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toastSvc.success('Cart cleared');
    },
    onError: (error) => {
      toastSvc.apiError(error);
    },
  });
};

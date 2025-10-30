import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  priceCents: number;
  currency: string;
  sizesJson: string;
  quantityAvailable: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export const useProducts = (filters?: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async (): Promise<Product[]> => {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());
      
      const response = await api.get(`/products?${params.toString()}`);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async (): Promise<Product> => {
      const response = await api.get(`/products/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

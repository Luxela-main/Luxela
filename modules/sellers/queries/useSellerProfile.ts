import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { sellersKeys } from './queryKeys';

export interface SellerProfile {
  seller: {
    id: string;
    userId: string;
    status: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  business: any;
  shipping: any;
  payment: any;
  additional: any;
}

export const useSellerProfile = () => {
  return useQuery<SellerProfile>({
    queryKey: sellersKeys.profile(),
    queryFn: async () => {
      const response = await api.get('/seller/profile');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

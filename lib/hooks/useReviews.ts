import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toastSvc } from '@/services/toast';

export interface Review {
  id: string;
  buyerId: string;
  listingId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  buyer: {
    id: string;
    name: string;
    image?: string;
  };
}

export const useReviews = (listingId?: string) => {
  return useQuery({
    queryKey: ['reviews', listingId],
    queryFn: async (): Promise<Review[]> => {
      const params = listingId ? `?listingId=${listingId}` : '';
      const response = await api.get(`/reviews${params}`);
      return response.data;
    },
    enabled: !!listingId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reviewData: { listingId: string; rating: number; comment: string }) => {
      const response = await api.post('/reviews', reviewData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.listingId] });
      toastSvc.success('Review submitted successfully');
    },
    onError: (error) => {
      toastSvc.apiError(error);
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...reviewData }: { id: string; rating: number; comment: string }) => {
      const response = await api.put(`/reviews/${id}`, reviewData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toastSvc.success('Review updated successfully');
    },
    onError: (error) => {
      toastSvc.apiError(error);
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/reviews/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toastSvc.success('Review deleted successfully');
    },
    onError: (error) => {
      toastSvc.apiError(error);
    },
  });
};

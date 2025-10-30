import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { sellersKeys } from './queryKeys';
import { toastSvc } from '@/services/toast';

export interface Listing {
  id: string;
  sellerId: string;
  type: 'single' | 'collection';
  title: string;
  description: string | null;
  category: string | null;
  image: string | null;
  priceCents: number | null;
  currency: string | null;
  sizesJson: string | null;
  supplyCapacity: string | null;
  quantityAvailable: number | null;
  limitedEditionBadge: string | null;
  releaseDuration: string | null;
  materialComposition: string | null;
  colorsAvailable: string | null;
  additionalTargetAudience: string | null;
  shippingOption: string | null;
  etaDomestic: string | null;
  etaInternational: string | null;
  itemsJson: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const useMyListings = () => {
  return useQuery<Listing[]>({
    queryKey: sellersKeys.listings(),
    queryFn: async () => {
      const response = await api.get('/listings/me');
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateListing = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (listingData: Partial<Listing>) => {
      const response = await api.post('/listings/create', listingData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellersKeys.listings() });
      toastSvc.success('Listing created successfully');
    },
    onError: (error) => {
      toastSvc.apiError(error);
    },
  });
};

export const useUpdateListing = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...listingData }: Partial<Listing> & { id: string }) => {
      const response = await api.put(`/listings/${id}`, listingData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellersKeys.listings() });
      toastSvc.success('Listing updated successfully');
    },
    onError: (error) => {
      toastSvc.apiError(error);
    },
  });
};

export const useDeleteListing = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/listings/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellersKeys.listings() });
      toastSvc.success('Listing deleted successfully');
    },
    onError: (error) => {
      toastSvc.apiError(error);
    },
  });
};

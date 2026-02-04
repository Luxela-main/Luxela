import { useQueryClient } from "@tanstack/react-query";
import { toastSvc } from "@/services/toast";
import { sellersKeys } from "./queryKeys";
import { trpc } from "@/lib/trpc";

export const useMyListings = () => {
  return (trpc.listing as any).getMyListings.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: undefined, // Disable auto-refetch
    refetchOnWindowFocus: false, // Disable window focus refetch
    refetchOnReconnect: true, 
    retry: 2,
    retryDelay: 1000,
  });
};

export const useCreateSingleListing = () => {
  const queryClient = useQueryClient();

  return (trpc.listing as any).createSingle.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sellersKeys.listings(),
      });
      toastSvc.success("Listing created successfully");
    },
    onError: (error: any) => toastSvc.apiError(error),
  });
};

export const useCreateCollectionListing = () => {
  const queryClient = useQueryClient();

  return (trpc.listing as any).createCollection.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sellersKeys.listings(),
      });
      toastSvc.success("Collection created successfully");
    },
    onError: (error: any) => toastSvc.apiError(error),
  });
};

export const useUpdateListing = () => {
  const queryClient = useQueryClient();

  return (trpc.listing as any).updateListing.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sellersKeys.listings(),
      });
      toastSvc.success("Listing updated successfully");
    },
    onError: (error: any) => toastSvc.apiError(error),
  });
};

export const useDeleteListing = () => {
  const queryClient = useQueryClient();

  return (trpc.listing as any).deleteListing.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sellersKeys.listings(),
      });
      toastSvc.success("Listing deleted successfully");
    },
    onError: (error: any) => toastSvc.apiError(error),
  });
};

export const useRestockListing = () => {
  const queryClient = useQueryClient();

  return (trpc.listing as any).restockListing.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sellersKeys.listings(),
      });
      toastSvc.success("Listing restocked successfully");
    },
    onError: (error: any) => toastSvc.apiError(error),
  });
};
import { useQueryClient } from "@tanstack/react-query";
import { toastSvc } from "@/services/toast";
import { sellersKeys } from "./queryKeys";
import { trpc } from "@/lib/trpc";

export const useMyListings = () => {
  return (trpc.listing as any).getMyListings.useQuery(undefined, {
    staleTime: 120000,
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

// TODO: add Update listing from the server
export const useUpdateListing = () => {
  console.warn("⚠️ updateListing mutation is not supported by backend");
  return {
    mutate: () =>
      toastSvc.error("Update listing is not implemented on the backend"),
  };
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

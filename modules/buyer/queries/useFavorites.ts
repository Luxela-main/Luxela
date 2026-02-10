"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";
import { buyerQueryKeys } from "./queryKeys";

export function useFavorites() {
  return useQuery({
    queryKey: buyerQueryKeys.favorites(),
    queryFn: async () => {
      try {
        const result = await ((trpc.buyer as any).getFavoriteListings as any).query();
        return result;
      } catch (err) {
        throw err;
      }
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useAddToFavorites() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listingId: string) => {
      return (trpc.buyer as any).addToFavorites.mutate({ listingId });
    },
    onSuccess: () => {
      toastSvc.success("Added to favorites");
      queryClient.invalidateQueries({
        queryKey: buyerQueryKeys.favorites(),
      });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}

export function useRemoveFromFavorites() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listingId: string) => {
      return (trpc.buyer as any).removeFromFavorites.mutate({ listingId });
    },
    onSuccess: () => {
      toastSvc.success("Removed from favorites");
      queryClient.invalidateQueries({
        queryKey: buyerQueryKeys.favorites(),
      });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listingId: string) => {
      return (trpc.buyer as any).toggleFavoriteListing.mutate({ listingId });
    },
    onSuccess: (data: any) => {
      const message = data?.isFavorited ? "Added to favorites" : "Removed from favorites";
      toastSvc.success(message);
      queryClient.invalidateQueries({
        queryKey: buyerQueryKeys.favorites(),
      });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}

export function useFavoritesCount() {
  const { data } = useFavorites();
  const favoritesCount = data?.length ?? 0;
  return favoritesCount;
}
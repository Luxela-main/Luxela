"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";

const reviewQueryKeys = {
  all: ["reviews"] as const,
  listingReviews: (listingId: string) => [...reviewQueryKeys.all, "listing", listingId] as const,
  myReviews: () => [...reviewQueryKeys.all, "my"] as const,
  reviewById: (id: string) => [...reviewQueryKeys.all, id] as const,
};

export function useListingReviews(listingId: string, limit?: number, offset?: number) {
  return useQuery({
    queryKey: reviewQueryKeys.listingReviews(listingId),
    queryFn: async () => {
      try {
        const result = await ((trpc.review as any).getListingReviews as any).query({
          listingId,
          limit,
          offset,
        });
        return result;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!listingId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useMyReviews() {
  return useQuery({
    queryKey: reviewQueryKeys.myReviews(),
    queryFn: async () => {
      try {
        const result = await ((trpc.review as any).getMyReviews as any).query();
        return result;
      } catch (err) {
        throw err;
      }
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      listingId: string;
      rating: number;
      title: string;
      comment: string;
      photos?: string[];
    }) => {
      return (trpc.review as any).createReview.mutate(input);
    },
    onSuccess: (data: any) => {
      toastSvc.success("Review posted successfully");
      queryClient.invalidateQueries({
        queryKey: reviewQueryKeys.listingReviews(data?.listingId),
      });
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.myReviews() });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      reviewId: string;
      rating?: number;
      title?: string;
      comment?: string;
      photos?: string[];
    }) => {
      return (trpc.review as any).updateReview.mutate(input);
    },
    onSuccess: (data: any) => {
      toastSvc.success("Review updated successfully");
      queryClient.invalidateQueries({
        queryKey: reviewQueryKeys.reviewById(data?.id),
      });
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.myReviews() });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      return (trpc.review as any).deleteReview.mutate({ reviewId });
    },
    onSuccess: () => {
      toastSvc.success("Review deleted successfully");
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.myReviews() });
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.all });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}

export function useLikeReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      return (trpc.review as any).likeReview.mutate({ reviewId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.all });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}
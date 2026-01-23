"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";
import { buyerQueryKeys } from "./queryKeys";

export function useProfile() {
  return useQuery({
    queryKey: buyerQueryKeys.profile(),
    queryFn: async () => {
      try {
        const result = await ((trpc.buyer as any).getProfile as any).query();
        return result;
      } catch (err) {
        throw err;
      }
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCreateBuyerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      username: string;
      fullName: string;
      dateOfBirth?: Date;
      phoneNumber?: string;
      country: string;
      state: string;
    }) => {
      return (trpc.buyer as any).createBuyerProfile.mutate(input);
    },
    onSuccess: () => {
      toastSvc.success("Profile created successfully");
      queryClient.invalidateQueries({
        queryKey: buyerQueryKeys.profile(),
      });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      username?: string;
      fullName?: string;
      dateOfBirth?: Date;
      phoneNumber?: string;
      country?: string;
      state?: string;
    }) => {
      return (trpc.buyer as any).updateAccountDetails.mutate(input);
    },
    onSuccess: () => {
      toastSvc.success("Profile updated successfully");
      queryClient.invalidateQueries({
        queryKey: buyerQueryKeys.profile(),
      });
      queryClient.invalidateQueries({
        queryKey: buyerQueryKeys.accountDetails(),
      });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}

export function useUploadProfilePicture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { base64Data: string; fileType: string }) => {
      return (trpc.buyer as any).uploadProfilePicture.mutate(input);
    },
    onSuccess: () => {
      toastSvc.success("Profile picture updated successfully");
      queryClient.invalidateQueries({
        queryKey: buyerQueryKeys.accountDetails(),
      });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}
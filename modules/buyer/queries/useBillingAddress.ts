"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";
import { buyerQueryKeys } from "./queryKeys";

export function useBillingAddresses() {
  return useQuery({
    queryKey: buyerQueryKeys.billingAddresses(),
    queryFn: async () => {
      try {
        const result = await ((trpc.buyer as any).getBillingAddresses as any).query();
        return result;
      } catch (err) {
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useBillingAddressById(id: string) {
  return useQuery({
    queryKey: buyerQueryKeys.billingAddressById(id),
    queryFn: async () => {
      try {
        const result = await ((trpc.buyer as any).getBillingAddressById as any).query({
          id,
        });
        return result;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateBillingAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      fullName: string;
      streetAddress: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      phoneNumber: string;
      isDefault?: boolean;
    }) => {
      return (trpc.buyer as any).createBillingAddress.mutate(input);
    },
    onSuccess: () => {
      toastSvc.success("Address added successfully");
      queryClient.invalidateQueries({
        queryKey: buyerQueryKeys.billingAddresses(),
      });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}

export function useUpdateBillingAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      fullName?: string;
      streetAddress?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      phoneNumber?: string;
      isDefault?: boolean;
    }) => {
      return (trpc.buyer as any).updateBillingAddress.mutate(input);
    },
    onSuccess: (_, variables) => {
      toastSvc.success("Address updated successfully");
      queryClient.invalidateQueries({
        queryKey: buyerQueryKeys.billingAddresses(),
      });
      queryClient.invalidateQueries({
        queryKey: buyerQueryKeys.billingAddressById(variables.id),
      });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}

export function useDeleteBillingAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return (trpc.buyer as any).deleteBillingAddress.mutate({ id });
    },
    onSuccess: () => {
      toastSvc.success("Address deleted successfully");
      queryClient.invalidateQueries({
        queryKey: buyerQueryKeys.billingAddresses(),
      });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}

export function useSetDefaultBillingAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return (trpc.buyer as any).setDefaultBillingAddress.mutate({ id });
    },
    onSuccess: () => {
      toastSvc.success("Default address updated");
      queryClient.invalidateQueries({
        queryKey: buyerQueryKeys.billingAddresses(),
      });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";

const paymentQueryKeys = {
  all: ["payments"] as const,
  methods: () => [...paymentQueryKeys.all, "methods"] as const,
  methodById: (id: string) => [...paymentQueryKeys.all, "method", id] as const,
  transactions: () => [...paymentQueryKeys.all, "transactions"] as const,
  transactionById: (id: string) => [...paymentQueryKeys.all, "transaction", id] as const,
};

export function usePaymentMethods() {
  return useQuery({
    queryKey: paymentQueryKeys.methods(),
    queryFn: async () => {
      try {
        const result = await ((trpc.payment as any).getPaymentMethods as any).query();
        return result;
      } catch (err) {
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function usePaymentMethodById(id: string) {
  return useQuery({
    queryKey: paymentQueryKeys.methodById(id),
    queryFn: async () => {
      try {
        const result = await ((trpc.payment as any).getPaymentMethodById as any).query({ id });
        return result;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      cardNumber: string;
      expiryMonth: number;
      expiryYear: number;
      cvv: string;
      cardholderName: string;
      isDefault?: boolean;
    }) => {
      return (trpc.payment as any).addPaymentMethod.mutate(input);
    },
    onSuccess: () => {
      toastSvc.success("Payment method added successfully");
      queryClient.invalidateQueries({ queryKey: paymentQueryKeys.methods() });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      cardholderName?: string;
      isDefault?: boolean;
    }) => {
      return (trpc.payment as any).updatePaymentMethod.mutate(input);
    },
    onSuccess: () => {
      toastSvc.success("Payment method updated");
      queryClient.invalidateQueries({ queryKey: paymentQueryKeys.methods() });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return (trpc.payment as any).deletePaymentMethod.mutate({ id });
    },
    onSuccess: () => {
      toastSvc.success("Payment method deleted");
      queryClient.invalidateQueries({ queryKey: paymentQueryKeys.methods() });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}

export function usePaymentTransactions(filters?: { status?: string; limit?: number }) {
  return useQuery({
    queryKey: paymentQueryKeys.transactions(),
    queryFn: async () => {
      try {
        const result = await ((trpc.payment as any).getTransactions as any).query(filters || {});
        return result;
      } catch (err) {
        throw err;
      }
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function usePaymentTransactionById(id: string) {
  return useQuery({
    queryKey: paymentQueryKeys.transactionById(id),
    queryFn: async () => {
      try {
        const result = await ((trpc.payment as any).getTransactionById as any).query({ id });
        return result;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}
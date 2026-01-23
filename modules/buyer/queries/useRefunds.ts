"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";

const refundQueryKeys = {
  all: ["refunds"] as const,
  list: () => [...refundQueryKeys.all, "list"] as const,
  byId: (id: string) => [...refundQueryKeys.all, id] as const,
  byOrder: (orderId: string) => [...refundQueryKeys.all, "order", orderId] as const,
};

export function useRefunds(filters?: { status?: string; limit?: number }) {
  return useQuery({
    queryKey: refundQueryKeys.list(),
    queryFn: async () => {
      try {
        const result = await ((trpc.refund as any).getMyRefunds as any).query(filters || {});
        return result;
      } catch (err) {
        throw err;
      }
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useRefundById(refundId: string) {
  return useQuery({
    queryKey: refundQueryKeys.byId(refundId),
    queryFn: async () => {
      try {
        const result = await ((trpc.refund as any).getRefundById as any).query({ refundId });
        return result;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!refundId,
    staleTime: 60 * 1000,
  });
}

export function useRefundsByOrder(orderId: string) {
  return useQuery({
    queryKey: refundQueryKeys.byOrder(orderId),
    queryFn: async () => {
      try {
        const result = await ((trpc.refund as any).getRefundsByOrder as any).query({ orderId });
        return result;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!orderId,
    staleTime: 60 * 1000,
  });
}

export function useRequestRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      orderId: string;
      reason: string;
      description?: string;
      photos?: string[];
    }) => {
      return (trpc.refund as any).requestRefund.mutate(input);
    },
    onSuccess: (data: any) => {
      toastSvc.success("Refund request submitted successfully");
      queryClient.invalidateQueries({ queryKey: refundQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: refundQueryKeys.byOrder(data?.orderId) });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}

export function useCancelRefundRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (refundId: string) => {
      return (trpc.refund as any).cancelRefundRequest.mutate({ refundId });
    },
    onSuccess: () => {
      toastSvc.success("Refund request canceled");
      queryClient.invalidateQueries({ queryKey: refundQueryKeys.list() });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}

export function useUploadRefundProof() {
  return useMutation({
    mutationFn: async (input: {
      refundId: string;
      base64Data: string;
      fileType: string;
    }) => {
      return (trpc.refund as any).uploadRefundProof.mutate(input);
    },
    onSuccess: () => {
      toastSvc.success("Proof uploaded successfully");
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}
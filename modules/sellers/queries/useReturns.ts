'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTRPCClient } from '@/lib/trpc';
import type { ReturnRequest, ReturnStatus, ReturnReason } from '../model/returns';

export function useReturnRequests(options?: { status?: ReturnStatus; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['returns', 'requests', options?.status, options?.limit, options?.offset],
    queryFn: async () => {
      const client: any = getTRPCClient();
      const result = await (client.returns as any).getReturnRequests.query({
        status: options?.status,
        limit: options?.limit || 20,
        offset: options?.offset || 0,
      });
      return result;
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useReturnRequest(returnId: string | undefined) {
  return useQuery({
    queryKey: ['returns', 'request', returnId],
    queryFn: async () => {
      if (!returnId) throw new Error('Return ID is required');
      const client: any = getTRPCClient();
      const result = await (client.returns as any).getReturnRequest.query({ returnId });
      return result;
    },
    enabled: !!returnId,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useReturnStats() {
  return useQuery({
    queryKey: ['returns', 'stats'],
    queryFn: async () => {
      const client: any = getTRPCClient();
      const result = await (client.returns as any).getReturnStats.query();
      return result;
    },
    staleTime: 60000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useApproveReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      returnId,
      returnShippingLabel,
      notes,
    }: {
      returnId: string;
      returnShippingLabel?: string;
      notes?: string;
    }) => {
      const client: any = getTRPCClient();
      return await (client.returns as any).approveReturn.mutate({
        returnId,
        returnShippingLabel,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['returns', 'stats'] });
    },
  });
}

export function useRejectReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ returnId, reason }: { returnId: string; reason: string }) => {
      const client: any = getTRPCClient();
      return await (client.returns as any).rejectReturn.mutate({
        returnId,
        reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['returns', 'stats'] });
    },
  });
}

export function useConfirmReturnReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      returnId,
      trackingNumber,
      inspectionNotes,
    }: {
      returnId: string;
      trackingNumber: string;
      inspectionNotes?: string;
    }) => {
      const client: any = getTRPCClient();
      return await (client.returns as any).confirmReturnReceipt.mutate({
        returnId,
        trackingNumber,
        inspectionNotes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns', 'requests'] });
    },
  });
}

export function useProcessRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      returnId,
      refundAmount,
      refundMethod,
    }: {
      returnId: string;
      refundAmount: number;
      refundMethod: 'original_payment' | 'store_credit';
    }) => {
      const client: any = getTRPCClient();
      return await (client.returns as any).processRefund.mutate({
        returnId,
        refundAmount,
        refundMethod,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['returns', 'stats'] });
    },
  });
}

export function useCancelReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ returnId, reason }: { returnId: string; reason: string }) => {
      const client: any = getTRPCClient();
      return await (client.returns as any).cancelReturn.mutate({
        returnId,
        reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['returns', 'stats'] });
    },
  });
}
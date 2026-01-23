import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { toastSvc } from '@/services/toast';
import { paymentKeys } from './queryKeys';

export function useCreatePaymentIntent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: {
      orderId: string;
      amount: number;
      currency?: string;
      paymentMethod: 'card' | 'bank_transfer' | 'wallet' | 'crypto';
      metadata?: Record<string, any>;
    }) => {
      return (trpc.paymentConfirmation as any).createPaymentIntent.mutate(input);
    },
    onSuccess: (data) => {
      toastSvc.success('Payment intent created');
      queryClient.invalidateQueries({
        queryKey: paymentKeys.all,
      });
    },
    onError: (error: any) => {
      toastSvc.error(error?.message || 'Failed to create payment intent');
    },
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: {
      intentId: string;
      transactionId: string;
      verificationCode?: string;
    }) => {
      return (trpc.paymentConfirmation as any).confirmPayment.mutate(input);
    },
    onSuccess: (data) => {
      toastSvc.success('Payment confirmed successfully! Order is being processed.');
      queryClient.invalidateQueries({
        queryKey: paymentKeys.all,
      });
    },
    onError: (error: any) => {
      toastSvc.error(
        error?.message || 'Payment confirmation failed. Please try again.'
      );
    },
  });
}

export function usePaymentStatus(intentId: string) {
  return useQuery({
    queryKey: paymentKeys.status(intentId),
    queryFn: async () => {
      return await ((trpc.paymentConfirmation as any).getPaymentStatus as any).query({
        intentId,
      });
    },
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 2000, // Poll every 2 seconds for pending payments
    enabled: !!intentId,
  });
}

export function useRefundPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: {
      paymentId: string;
      reason: string;
      amount?: number;
    }) => {
      return (trpc.paymentConfirmation as any).refundPayment.mutate(input);
    },
    onSuccess: (data) => {
      toastSvc.success('Refund initiated. You will receive funds within 3-5 business days.');
      queryClient.invalidateQueries({
        queryKey: paymentKeys.all,
      });
    },
    onError: (error: any) => {
      toastSvc.error(error?.message || 'Failed to initiate refund');
    },
  });
}

export function useMyPayments(limit = 50, offset = 0) {
  return useQuery({
    queryKey: paymentKeys.list(limit, offset),
    queryFn: async () => {
      return await ((trpc.paymentConfirmation as any).getMyPayments as any).query({
        limit,
        offset,
      });
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function usePaymentWebhook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: {
      event: string;
      data: Record<string, any>;
      signature: string;
    }) => {
      return (trpc.paymentConfirmation as any).handlePaymentWebhook.mutate(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: paymentKeys.all,
      });
    },
  });
}
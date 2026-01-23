import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { sellerQueryKeys } from './queryKeys';
import { useToast } from '@/components/hooks/useToast';

export const usePayoutMethods = () => {
  return useQuery({
    queryKey: sellerQueryKeys.payoutMethods(),
    queryFn: async () => {
      const methods = await ((trpc.sales as any).getPayoutMethods as any).query();
      return methods;
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 15,
  });
};

export const useAddPayoutMethod = () => {
  const queryClient = useQueryClient();
  const toastSvc = useToast();

  return useMutation({
    mutationFn: async (data: {
      type: 'bank_transfer' | 'paypal' | 'stripe';
      accountDetails: Record<string, string>;
      isDefault: boolean;
    }) => {
      return await (trpc.sales as any).addPayoutMethod.mutate(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.payoutMethods(),
      });
      toastSvc.success('Payment method added successfully');
    },
    onError: (error: any) => {
      toastSvc.error(error.message || 'Failed to add payment method');
    },
  });
};

export const useUpdatePayoutMethod = () => {
  const queryClient = useQueryClient();
  const toastSvc = useToast();

  return useMutation({
    mutationFn: async (data: {
      methodId: string;
      accountDetails?: Record<string, string>;
      isDefault?: boolean;
    }) => {
      return await (trpc.sales as any).updatePayoutMethod.mutate(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.payoutMethods(),
      });
      toastSvc.success('Payment method updated successfully');
    },
    onError: (error: any) => {
      toastSvc.error(error.message || 'Failed to update payment method');
    },
  });
};

export const useDeletePayoutMethod = () => {
  const queryClient = useQueryClient();
  const toastSvc = useToast();

  return useMutation({
    mutationFn: async (methodId: string) => {
      return await (trpc.sales as any).deletePayoutMethod.mutate({ methodId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.payoutMethods(),
      });
      toastSvc.success('Payment method deleted successfully');
    },
    onError: (error: any) => {
      toastSvc.error(error.message || 'Failed to delete payment method');
    },
  });
};
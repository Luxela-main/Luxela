import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTRPCClient } from '@/lib/trpc';
import { sellerQueryKeys } from './queryKeys';
import { useToast } from '@/components/hooks/useToast';

export const usePayoutMethods = () => {
  return useQuery({
    queryKey: sellerQueryKeys.payoutMethods(),
    queryFn: async () => {
      const client = getTRPCClient();
      const methods = await ((client.sales as any).getPayoutMethod as any).query();
      return methods;
    },
    staleTime: 1000 * 30, // 30 seconds for fresher real-time updates
    gcTime: 1000 * 60 * 5,
  });
};

export const useAddPayoutMethod = () => {
  const queryClient = useQueryClient();
  const toastSvc = useToast();

  return useMutation({
    mutationFn: async (data: {
      type: 'bank_transfer' | 'paypal' | 'stripe' | 'crypto' | 'wise';
      accountDetails: Record<string, string>;
      isDefault?: boolean;
    }) => {
      const client = getTRPCClient();
      return await ((client.sales as any).addPayoutMethod as any).mutate(data);
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
      const client = getTRPCClient();
      return await ((client.sales as any).updatePayoutMethod as any).mutate(data);
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
      const client = getTRPCClient();
      return await ((client.sales as any).deletePayoutMethod as any).mutate({ methodId });
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
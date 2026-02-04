import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTRPCClient } from '@/lib/trpc';
import { sellerQueryKeys } from '../queries/queryKeys';
import { useToast } from '@/components/hooks/useToast';

export const useSendPayoutVerification = () => {
  const queryClient = useQueryClient();
  const toastSvc = useToast();

  return useMutation({
    mutationFn: async (methodId: string) => {
      const client = getTRPCClient();
      return await ((client.payoutVerification as any).sendVerificationCode as any).mutate({
        methodId,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.payoutMethods(),
      });
      toastSvc.success(`Verification code sent! Check your email for the ${data.methodType} confirmation.`);
    },
    onError: (error: any) => {
      toastSvc.error(error.message || 'Failed to send verification code');
    },
  });
};

export const useVerifyPayoutMethod = () => {
  const queryClient = useQueryClient();
  const toastSvc = useToast();

  return useMutation({
    mutationFn: async (data: {
      methodId: string;
      verificationCode?: string;
      verificationToken?: string;
    }) => {
      const client = getTRPCClient();
      return await ((client.payoutVerification as any).verifyPayoutMethod as any).mutate(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.payoutMethods(),
      });
      toastSvc.success('🎉 Your payout method is now verified and active!');
    },
    onError: (error: any) => {
      toastSvc.error(error.message || 'Failed to verify payout method');
    },
  });
};

export const usePayoutVerificationStatus = (methodId: string | null) => {
  return useQuery({
    queryKey: ['payoutVerificationStatus', methodId],
    queryFn: async () => {
      if (!methodId) return null;
      const client = getTRPCClient();
      return await ((client.payoutVerification as any).getVerificationStatus as any).query({
        methodId,
      });
    },
    enabled: !!methodId,
    staleTime: 1000 * 60 * 5,
  });
};
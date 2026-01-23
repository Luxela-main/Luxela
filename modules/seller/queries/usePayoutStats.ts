import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { sellerQueryKeys } from './queryKeys';

export const usePayoutStats = () => {
  return useQuery({
    queryKey: sellerQueryKeys.payoutStats(),
    queryFn: async () => {
      const stats = await (trpc.finance.getPayoutStats as any).query();
      return stats;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 60 * 5,
  });
};

export const usePayoutHistory = (filters?: { month?: string; year?: number }) => {
  return useQuery({
    queryKey: sellerQueryKeys.payoutHistory(filters),
    queryFn: async () => {
      const history = await (trpc.finance.getPayoutHistory as any).query({
        month: filters?.month,
        year: filters?.year,
      });
      return history;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};
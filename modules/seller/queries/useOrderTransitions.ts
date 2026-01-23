import { trpc } from '@/lib/trpc';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useOrderTransitions = (orderId: string) => {
  const queryClient = useQueryClient();

  // Get order transitions/status history
  const getOrderTransitions = (trpc.orderStatus as any).procedure.getOrderTransitions.useQuery(
    { orderId },
    { enabled: !!orderId, staleTime: 1000 * 60 * 5 }
  );

  // Get complete audit trail
  const getTransitionsByOrder = (trpc.orderStatus as any).procedure.getTransitionsByOrder.useQuery(
    { orderId },
    { enabled: !!orderId, staleTime: 1000 * 60 * 5 }
  );

  // Create state transition record
  const createTransition = useMutation({
    mutationFn: (data: {
      orderId: string;
      fromStatus: 'processing' | 'shipped' | 'delivered' | 'canceled' | 'returned';
      toStatus: 'processing' | 'shipped' | 'delivered' | 'canceled' | 'returned';
      triggeredBy: string;
      triggeredByRole?: 'buyer' | 'seller' | 'admin';
      reason?: string;
      metadata?: Record<string, unknown>;
    }) => (trpc.orderStatus as any).procedure.createTransition.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderStatus', 'getOrderTransitions'] });
    },
  });

  return {
    getOrderTransitions,
    getTransitionsByOrder,
    createTransition,
  };
};
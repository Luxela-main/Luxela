import { useState, useCallback, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { TRPCClientError } from '@trpc/client';

interface CancelOrderInput {
  orderId: string;
  reason?: string;
}

interface DeleteFromHistoryInput {
  orderId: string;
}

export interface UseBuyerOrderActionsState {
  isLoading: boolean;
  isCancelling: boolean;
  isDeleting: boolean;
  error: string | null;
  success: string | null;
}

export const useBuyerOrderActions = () => {
  const [state, setState] = useState<UseBuyerOrderActionsState>({
    isLoading: false,
    isCancelling: false,
    isDeleting: false,
    error: null,
    success: null,
  });

  const isMountedRef = useRef(true);
  const cancelOrderMutation = trpc.buyerOrderActions.cancelOrder.useMutation();
  const deleteFromHistoryMutation = trpc.buyerOrderActions.deleteFromHistory.useMutation();

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const updateState = useCallback((updates: Partial<UseBuyerOrderActionsState>) => {
    if (!isMountedRef.current) return;
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const cancelOrder = useCallback(
    async (input: CancelOrderInput) => {
      try {
        updateState({ isCancelling: true, error: null, success: null });

        const result = await cancelOrderMutation.mutateAsync(input);

        if (isMountedRef.current) {
          updateState({
            isCancelling: false,
            success: result.message || 'Order cancelled successfully',
          });
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof TRPCClientError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Failed to cancel order. Please try again.';

        updateState({
          isCancelling: false,
          error: errorMessage,
        });

        throw err;
      }
    },
    [cancelOrderMutation, updateState]
  );

  const deleteFromHistory = useCallback(
    async (input: DeleteFromHistoryInput) => {
      try {
        updateState({ isDeleting: true, error: null, success: null });

        const result = await deleteFromHistoryMutation.mutateAsync(input);

        if (isMountedRef.current) {
          updateState({
            isDeleting: false,
            success: result.message || 'Order deleted from history',
          });
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof TRPCClientError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Failed to delete order from history. Please try again.';

        updateState({
          isDeleting: false,
          error: errorMessage,
        });

        throw err;
      }
    },
    [deleteFromHistoryMutation, updateState]
  );

  const clearMessages = useCallback(() => {
    updateState({ error: null, success: null });
  }, [updateState]);

  return {
    // State
    isLoading: state.isLoading,
    isCancelling: state.isCancelling,
    isDeleting: state.isDeleting,
    error: state.error,
    success: state.success,

    // Actions
    cancelOrder,
    deleteFromHistory,
    clearMessages,
  };
};
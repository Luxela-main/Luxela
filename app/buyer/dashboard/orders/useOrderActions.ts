'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/components/hooks/useToast';

type ReturnReason = 'defective' | 'damaged' | 'not_as_described' | 'unwanted' | 'too_small' | 'too_large' | 'color_mismatch' | 'wrong_item' | 'other';

export function useOrderActions() {
  const router = useRouter();
  const toastHandler = useToast();
  const utils = trpc.useUtils();
  const isMountedRef = useRef(true);

  // Mutations
  const confirmDeliveryMutation = trpc.buyerOrderActions.confirmDelivery.useMutation();
  const requestReturnMutation = trpc.returns.requestReturn.useMutation();
  const createSupportTicketMutation = trpc.support.createTicket.useMutation();
  const sendMessageMutation = trpc.buyerOrderActions.sendMessage.useMutation();
  const cancelOrderMutation = trpc.buyerOrderActions.cancelOrder.useMutation();
  const deleteFromHistoryMutation = trpc.buyerOrderActions.deleteFromHistory.useMutation();

  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);

  // Debounce refs to prevent double-submissions
  const debounceTimersRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      Object.values(debounceTimersRef.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Debounce helper
  const debounce = useCallback((key: string, fn: () => Promise<void>, delay = 300) => {
    if (debounceTimersRef.current[key]) {
      clearTimeout(debounceTimersRef.current[key]);
    }
    debounceTimersRef.current[key] = setTimeout(fn, delay);
  }, []);

  const confirmDelivery = useCallback(async (orderId: string) => {
    setIsConfirmingDelivery(true);
    const executeConfirm = async () => {
      try {
        await confirmDeliveryMutation.mutateAsync({ orderId });

        if (!isMountedRef.current) return;
        
        toastHandler.success('Order marked as delivered. You can now leave a review!');
        
        // Invalidate the purchase history query to refresh the order
        await utils.buyer.getPurchaseHistory.invalidate();
        
        router.refresh();
      } catch (error: any) {
        if (!isMountedRef.current) return;
        
        toastHandler.error(error?.message || 'Failed to confirm delivery');
      } finally {
        if (isMountedRef.current) {
          setIsConfirmingDelivery(false);
        }
      }
    };
    debounce(`confirm-${orderId}`, executeConfirm);
  }, [debounce, confirmDeliveryMutation, toastHandler, utils, router]);

  const requestReturn = useCallback(async (
    orderId: string,
    reason: ReturnReason,
    reasonDescription: string
  ) => {
    setIsSubmittingReturn(true);
    const executeReturn = async () => {
      try {
        const result = await requestReturnMutation.mutateAsync({
          orderId,
          reason,
          reasonDescription,
        });

        if (!isMountedRef.current) return;
        
        toastHandler.success(result.message || 'The seller will review your request within 2-3 business days.');
        
        // Invalidate the purchase history query to refresh the order
        await utils.buyer.getPurchaseHistory.invalidate();
        
        router.refresh();
      } catch (error: any) {
        if (!isMountedRef.current) return;
        
        toastHandler.error(error?.message || 'Failed to submit return request');
      } finally {
        if (isMountedRef.current) {
          setIsSubmittingReturn(false);
        }
      }
    };
    debounce(`return-${orderId}`, executeReturn);
  }, [debounce, requestReturnMutation, toastHandler, utils, router]);

  const contactSeller = useCallback(async (orderId: string, sellerId: string, message: string) => {
    setIsSubmittingSupport(true);
    const executeSend = async () => {
      try {
        // Send direct message to seller
        await sendMessageMutation.mutateAsync({
          orderId,
          recipientId: sellerId,
          message,
          recipientRole: 'seller',
        });

        if (!isMountedRef.current) return;
        
        toastHandler.success('Your message has been sent to the seller. They will respond shortly.');
        
        router.refresh();
      } catch (error: any) {
        if (!isMountedRef.current) return;
        
        toastHandler.error(error?.message || 'Failed to send message to seller');
      } finally {
        if (isMountedRef.current) {
          setIsSubmittingSupport(false);
        }
      }
    };
    debounce(`contact-${orderId}`, executeSend);
  }, [debounce, sendMessageMutation, toastHandler, router]);

  const contactSupport = useCallback(async (orderId: string, message: string) => {
    setIsSubmittingSupport(true);
    const executeSupport = async () => {
      try {
        // Create a support ticket for critical issues
        const result = await createSupportTicketMutation.mutateAsync({
          subject: `Support Needed for Order #${orderId.slice(0, 8)}`,
          description: message,
          category: 'order_issue',
          orderId,
          priority: 'high',
        });

        if (!isMountedRef.current) return;
        
        toastHandler.success('Your support request has been submitted. Our team will assist you shortly.');
        
        router.push(`/buyer/dashboard/support-tickets/${result.id}`);
      } catch (error: any) {
        if (!isMountedRef.current) return;
        
        toastHandler.error(error?.message || 'Failed to create support ticket');
      } finally {
        if (isMountedRef.current) {
          setIsSubmittingSupport(false);
        }
      }
    };
    debounce(`support-${orderId}`, executeSupport);
  }, [debounce, createSupportTicketMutation, toastHandler, router]);

  const cancelOrder = useCallback(async (orderId: string, reason?: string) => {
    setIsCancellingOrder(true);
    const executeCancel = async () => {
      try {
        const result = await cancelOrderMutation.mutateAsync({
          orderId,
          reason,
        });

        if (!isMountedRef.current) return;
        
        toastHandler.success(result.message || 'Your order has been successfully cancelled. The seller has been notified.');
        
        // Invalidate the purchase history query to refresh the order
        await utils.buyer.getPurchaseHistory.invalidate();
        
        router.refresh();
      } catch (error: any) {
        if (!isMountedRef.current) return;
        
        toastHandler.error(error?.message || 'Failed to cancel order');
      } finally {
        if (isMountedRef.current) {
          setIsCancellingOrder(false);
        }
      }
    };
    debounce(`cancel-${orderId}`, executeCancel);
  }, [debounce, cancelOrderMutation, toastHandler, utils, router]);

  const deleteFromHistory = useCallback(async (orderId: string) => {
    setIsDeletingOrder(true);
    const executeDelete = async () => {
      try {
        const result = await deleteFromHistoryMutation.mutateAsync({
          orderId,
        });

        if (!isMountedRef.current) return;
        
        toastHandler.success(result.message || 'Order has been removed from your history.');
        
        // Invalidate the purchase history query to refresh the order
        await utils.buyer.getPurchaseHistory.invalidate();
        
        router.refresh();
      } catch (error: any) {
        if (!isMountedRef.current) return;
        
        toastHandler.error(error?.message || 'Failed to delete order from history');
      } finally {
        if (isMountedRef.current) {
          setIsDeletingOrder(false);
        }
      }
    };
    debounce(`delete-${orderId}`, executeDelete);
  }, [debounce, deleteFromHistoryMutation, toastHandler, utils, router]);

  return {
    confirmDelivery,
    requestReturn,
    contactSeller,
    contactSupport,
    cancelOrder,
    deleteFromHistory,
    isConfirmingDelivery,
    isSubmittingReturn,
    isSubmittingSupport,
    isCancellingOrder,
    isDeletingOrder,
  };
}
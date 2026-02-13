'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';

type ReturnReason = 'defective' | 'damaged' | 'not_as_described' | 'unwanted' | 'too_small' | 'too_large' | 'color_mismatch' | 'wrong_item' | 'other';

export function useOrderActions() {
  const router = useRouter();
  const { toast } = useToast();

  // Mutations
  const confirmDeliveryMutation = trpc.buyerOrderActions.confirmDelivery.useMutation();
  const requestReturnMutation = trpc.returns.requestReturn.useMutation();
  const createSupportTicketMutation = trpc.support.createTicket.useMutation();
  const sendMessageMutation = trpc.buyerOrderActions.sendMessage.useMutation();

  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  const confirmDelivery = async (orderId: string) => {
    setIsConfirmingDelivery(true);
    try {
      await confirmDeliveryMutation.mutateAsync({ orderId });

      toast({
        title: 'Success',
        description: 'Order marked as delivered. You can now leave a review!',
        duration: 5000,
      });

      // Refresh the page to show updated status
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to confirm delivery',
        variant: 'destructive',
        duration: 5000,
      });
      console.error('Confirm delivery error:', error);
    } finally {
      setIsConfirmingDelivery(false);
    }
  };

  const requestReturn = async (
    orderId: string,
    reason: ReturnReason,
    reasonDescription: string
  ) => {
    setIsSubmittingReturn(true);
    try {
      const result = await requestReturnMutation.mutateAsync({
        orderId,
        reason,
        reasonDescription,
      });

      toast({
        title: 'Return Request Submitted',
        description: result.message || 'The seller will review your request within 2-3 business days.',
        duration: 5000,
      });

      // Refresh the page to show updated status
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to submit return request',
        variant: 'destructive',
        duration: 5000,
      });
      console.error('Return request error:', error);
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const contactSeller = async (orderId: string, sellerId: string, message: string) => {
    setIsSubmittingSupport(true);
    try {
      // Send direct message to seller
      await sendMessageMutation.mutateAsync({
        orderId,
        recipientId: sellerId,
        message,
        recipientRole: 'seller',
      });

      toast({
        title: 'Message Sent',
        description: 'Your message has been sent to the seller. They will respond shortly.',
        duration: 5000,
      });

      // Refresh the page to show the new message
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to send message to seller',
        variant: 'destructive',
        duration: 5000,
      });
      console.error('Contact seller error:', error);
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  const contactSupport = async (orderId: string, message: string) => {
    setIsSubmittingSupport(true);
    try {
      // Create a support ticket for critical issues
      const result = await createSupportTicketMutation.mutateAsync({
        subject: `Support Needed for Order #${orderId.slice(0, 8)}`,
        description: message,
        category: 'order_issue',
        orderId,
        priority: 'high',
      });

      toast({
        title: 'Support Ticket Created',
        description: 'Your support request has been submitted. Our team will assist you shortly.',
        duration: 5000,
      });

      // Redirect to support ticket
      router.push(`/buyer/dashboard/support-tickets/${result.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create support ticket',
        variant: 'destructive',
        duration: 5000,
      });
      console.error('Contact support error:', error);
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  return {
    confirmDelivery,
    requestReturn,
    contactSeller,
    contactSupport,
    isConfirmingDelivery,
    isSubmittingReturn,
    isSubmittingSupport,
  };
}
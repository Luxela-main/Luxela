import { useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { queryKeys } from './queryKeys';

export const useEmailNotification = () => {
  const queryClient = useQueryClient();

  // Send payment receipt
  const sendPaymentReceipt = trpc.emailNotification.sendPaymentReceipt.useMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.email.history(),
      });
    },
    onError: (error: any) => {
      console.error('Payment receipt error:', error);
    },
  });

  // Send order confirmation
  const sendOrderConfirmation = trpc.emailNotification.sendOrderConfirmation.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.email.history(),
      });
    },
  });

  // Send shipping notification
  const sendShippingNotification = trpc.emailNotification.sendShippingNotification.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.email.history(),
      });
    },
  });

  // Send delivery confirmation
  const sendDeliveryConfirmation = trpc.emailNotification.sendDeliveryConfirmation.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.email.history(),
      });
    },
  });

  // Send refund notification
  const sendRefundNotification = trpc.emailNotification.sendRefundNotification.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.email.history(),
      });
    },
  });

  // Get email history
  const getEmailHistory = trpc.emailNotification.getEmailHistory.useQuery({
    limit: 50,
  });

  // Resend email
  const resendEmail = trpc.emailNotification.resendEmail.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.email.history(),
      });
    },
  });

  // Get email templates
  const getEmailTemplates = trpc.emailNotification.getEmailTemplates.useQuery();

  return {
    // Payment receipt
    sendPaymentReceipt: sendPaymentReceipt.mutate,
    sendPaymentReceiptAsync: sendPaymentReceipt.mutateAsync,
    isPaymentReceiptLoading: sendPaymentReceipt.isPending,
    paymentReceiptError: sendPaymentReceipt.error,

    // Order confirmation
    sendOrderConfirmation: sendOrderConfirmation.mutate,
    sendOrderConfirmationAsync: sendOrderConfirmation.mutateAsync,
    isOrderConfirmationLoading: sendOrderConfirmation.isPending,
    orderConfirmationError: sendOrderConfirmation.error,

    // Shipping notification
    sendShippingNotification: sendShippingNotification.mutate,
    sendShippingNotificationAsync: sendShippingNotification.mutateAsync,
    isShippingLoading: sendShippingNotification.isPending,
    shippingNotificationError: sendShippingNotification.error,

    // Delivery confirmation
    sendDeliveryConfirmation: sendDeliveryConfirmation.mutate,
    sendDeliveryConfirmationAsync: sendDeliveryConfirmation.mutateAsync,
    isDeliveryLoading: sendDeliveryConfirmation.isPending,
    deliveryConfirmationError: sendDeliveryConfirmation.error,

    // Refund notification
    sendRefundNotification: sendRefundNotification.mutate,
    sendRefundNotificationAsync: sendRefundNotification.mutateAsync,
    isRefundLoading: sendRefundNotification.isPending,
    refundNotificationError: sendRefundNotification.error,

    // Email history
    emailHistory: getEmailHistory.data,
    isLoadingHistory: getEmailHistory.isLoading,
    historyError: getEmailHistory.error,

    // Resend
    resendEmail: resendEmail.mutate,
    resendEmailAsync: resendEmail.mutateAsync,
    isResending: resendEmail.isPending,
    resendError: resendEmail.error,

    // Templates
    emailTemplates: getEmailTemplates.data,
    isLoadingTemplates: getEmailTemplates.isLoading,
    templatesError: getEmailTemplates.error,
  };
};
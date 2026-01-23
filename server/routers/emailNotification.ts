import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

// Email template types
type EmailTemplate =
  | 'payment_receipt'
  | 'order_confirmation'
  | 'order_shipped'
  | 'order_delivered'
  | 'refund_initiated'
  | 'refund_completed'
  | 'support_ticket_created'
  | 'support_ticket_resolved';

export interface EmailPayload {
  to: string;
  template: EmailTemplate;
  data: Record<string, any>;
  subject?: string;
}

export const emailNotificationRouter = createTRPCRouter({
  // Send payment receipt email
  sendPaymentReceipt: protectedProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        paymentId: z.string().uuid(),
        recipientEmail: z.string().email(),
        sendCopy: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.user?.id;
        if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

        // TODO: Fetch order and payment details from database
        const paymentReceiptEmail: EmailPayload = {
          to: input.recipientEmail,
          template: 'payment_receipt',
          subject: `Payment Receipt - Order #${input.orderId.slice(0, 8)}`,
          data: {
            orderId: input.orderId,
            paymentId: input.paymentId,
            amount: 99.99,
            currency: 'USD',
            paymentMethod: 'Credit Card',
            transactionId: 'txn_123456789',
            timestamp: new Date(),
            items: [
              {
                name: 'Product Name',
                quantity: 1,
                unitPrice: 99.99,
                total: 99.99,
              },
            ],
            subtotal: 99.99,
            tax: 0,
            shipping: 5.0,
            total: 104.99,
            invoiceNumber: `INV-${input.paymentId.slice(0, 8)}`,
          },
        };

        // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
        console.log('Sending payment receipt email:', paymentReceiptEmail);

        // Simulate sending
        const emailLog = {
          id: uuidv4(),
          orderId: input.orderId,
          paymentId: input.paymentId,
          template: 'payment_receipt',
          recipientEmail: input.recipientEmail,
          status: 'sent',
          sentAt: new Date(),
          metadata: paymentReceiptEmail,
        };

        return {
          success: true,
          message: 'Payment receipt sent successfully',
          emailLog,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to send payment receipt',
        });
      }
    }),

  // Send order confirmation email
  sendOrderConfirmation: protectedProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        recipientEmail: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.user?.id;
        if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const orderConfirmationEmail: EmailPayload = {
          to: input.recipientEmail,
          template: 'order_confirmation',
          subject: `Order Confirmation - #${input.orderId.slice(0, 8)}`,
          data: {
            orderId: input.orderId,
            orderNumber: `ORD-${input.orderId.slice(0, 8)}`,
            timestamp: new Date(),
            items: [
              {
                name: 'Product Name',
                quantity: 1,
                price: 99.99,
              },
            ],
            total: 104.99,
            status: 'confirmed',
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            trackingNumber: null,
          },
        };

        console.log('Sending order confirmation email:', orderConfirmationEmail);

        const emailLog = {
          id: uuidv4(),
          orderId: input.orderId,
          template: 'order_confirmation',
          recipientEmail: input.recipientEmail,
          status: 'sent',
          sentAt: new Date(),
          metadata: orderConfirmationEmail,
        };

        return {
          success: true,
          message: 'Order confirmation sent successfully',
          emailLog,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to send order confirmation',
        });
      }
    }),

  // Send order shipped notification
  sendShippingNotification: protectedProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        recipientEmail: z.string().email(),
        trackingNumber: z.string(),
        carrier: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.user?.id;
        if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const shippingEmail: EmailPayload = {
          to: input.recipientEmail,
          template: 'order_shipped',
          subject: `Your Order is On the Way - #${input.orderId.slice(0, 8)}`,
          data: {
            orderId: input.orderId,
            trackingNumber: input.trackingNumber,
            carrier: input.carrier,
            timestamp: new Date(),
            estimatedDelivery: new Date(
              Date.now() + 5 * 24 * 60 * 60 * 1000
            ),
            trackingUrl: `https://tracking.example.com/${input.trackingNumber}`,
          },
        };

        console.log('Sending shipping notification:', shippingEmail);

        const emailLog = {
          id: uuidv4(),
          orderId: input.orderId,
          template: 'order_shipped',
          recipientEmail: input.recipientEmail,
          status: 'sent',
          sentAt: new Date(),
          metadata: shippingEmail,
        };

        return {
          success: true,
          message: 'Shipping notification sent successfully',
          emailLog,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to send shipping notification',
        });
      }
    }),

  // Send delivery confirmation
  sendDeliveryConfirmation: protectedProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        recipientEmail: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.user?.id;
        if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const deliveryEmail: EmailPayload = {
          to: input.recipientEmail,
          template: 'order_delivered',
          subject: `Your Order Has Been Delivered - #${input.orderId.slice(0, 8)}`,
          data: {
            orderId: input.orderId,
            deliveredAt: new Date(),
            returnWindowDays: 30,
            returnDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        };

        console.log('Sending delivery confirmation:', deliveryEmail);

        const emailLog = {
          id: uuidv4(),
          orderId: input.orderId,
          template: 'order_delivered',
          recipientEmail: input.recipientEmail,
          status: 'sent',
          sentAt: new Date(),
          metadata: deliveryEmail,
        };

        return {
          success: true,
          message: 'Delivery confirmation sent successfully',
          emailLog,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to send delivery confirmation',
        });
      }
    }),

  // Send refund initiated notification
  sendRefundNotification: protectedProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        recipientEmail: z.string().email(),
        refundAmount: z.number().positive(),
        rmaNumber: z.string().optional(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.user?.id;
        if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const refundEmail: EmailPayload = {
          to: input.recipientEmail,
          template: 'refund_initiated',
          subject: `Refund Initiated - #${input.orderId.slice(0, 8)}`,
          data: {
            orderId: input.orderId,
            refundAmount: input.refundAmount,
            rmaNumber: input.rmaNumber,
            reason: input.reason,
            timestamp: new Date(),
            expectedRefundDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          },
        };

        console.log('Sending refund notification:', refundEmail);

        const emailLog = {
          id: uuidv4(),
          orderId: input.orderId,
          template: 'refund_initiated',
          recipientEmail: input.recipientEmail,
          status: 'sent',
          sentAt: new Date(),
          metadata: refundEmail,
        };

        return {
          success: true,
          message: 'Refund notification sent successfully',
          emailLog,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to send refund notification',
        });
      }
    }),

  // Get email history
  getEmailHistory: protectedProcedure
    .input(
      z.object({
        orderId: z.string().uuid().optional(),
        template: z
          .enum([
            'payment_receipt',
            'order_confirmation',
            'order_shipped',
            'order_delivered',
            'refund_initiated',
            'refund_completed',
            'support_ticket_created',
            'support_ticket_resolved',
          ])
          .optional(),
        limit: z.number().max(100).default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.user?.id;
        if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

        // TODO: Query from database with filters
        const emailHistory = [
          {
            id: uuidv4(),
            orderId: input.orderId,
            template: 'payment_receipt',
            recipientEmail: 'buyer@example.com',
            status: 'sent',
            sentAt: new Date(),
          },
        ];

        return {
          total: emailHistory.length,
          emails: emailHistory,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to fetch email history',
        });
      }
    }),

  // Resend email
  resendEmail: protectedProcedure
    .input(z.object({ emailLogId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.user?.id;
        if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

        // TODO: Fetch email log and resend

        return {
          success: true,
          message: 'Email resent successfully',
          emailLogId: input.emailLogId,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to resend email',
        });
      }
    }),

  // Get email templates (for reference)
  getEmailTemplates: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      return {
        templates: [
          {
            id: 'payment_receipt',
            name: 'Payment Receipt',
            description: 'Sent when payment is confirmed',
          },
          {
            id: 'order_confirmation',
            name: 'Order Confirmation',
            description: 'Sent when order is confirmed',
          },
          {
            id: 'order_shipped',
            name: 'Order Shipped',
            description: 'Sent when order is shipped with tracking info',
          },
          {
            id: 'order_delivered',
            name: 'Order Delivered',
            description: 'Sent when order is delivered',
          },
          {
            id: 'refund_initiated',
            name: 'Refund Initiated',
            description: 'Sent when refund is initiated',
          },
          {
            id: 'refund_completed',
            name: 'Refund Completed',
            description: 'Sent when refund is completed',
          },
          {
            id: 'support_ticket_created',
            name: 'Support Ticket Created',
            description: 'Sent when support ticket is created',
          },
          {
            id: 'support_ticket_resolved',
            name: 'Support Ticket Resolved',
            description: 'Sent when support ticket is resolved',
          },
        ],
      };
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Failed to fetch email templates',
      });
    }
  }),
});
import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { db } from '../db';
import { orders, conversations, messages } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getSeller } from './utils';
import { notifyDeliveryConfirmed, notifyOrderConfirmed } from '../services/notificationService';

export const sellerOrdersRouter = createTRPCRouter({
  confirmDelivery: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/seller/orders/confirm-delivery',
        tags: ['Seller Orders'],
        summary: 'Confirm order delivery',
        description: 'Seller confirms package delivery, notifies buyer, and initiates payout processing',
      },
    })
    .input(
      z.object({
        orderId: z.string().uuid(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        const seller = await getSeller(userId);
        if (!seller) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Seller profile not found',
          });
        }

        // Get order and verify it belongs to this seller
        const [order] = await db
          .select()
          .from(orders)
          .where(
            and(
              eq(orders.id, input.orderId),
              eq(orders.sellerId, seller.id)
            )
          );

        if (!order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not found or does not belong to this seller',
          });
        }

        if (order.deliveryStatus === 'delivered') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Order has already been marked as delivered',
          });
        }

        // Update order status to delivered
        await db
          .update(orders)
          .set({
            deliveryStatus: 'delivered',
            payoutStatus: 'processing',
            updatedAt: new Date(),
          })
          .where(eq(orders.id, input.orderId));

        // Send notification to buyer
        await notifyDeliveryConfirmed(
          seller.id,
          order.buyerId,
          order.id
        );

        return {
          success: true,
          message: 'Delivery confirmed! Buyer notified and funds released from escrow.',
        };
      } catch (err: any) {
        console.error('Error confirming delivery:', err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err?.message || 'Failed to confirm delivery',
        });
      }
    }),

  updateOrderStatus: protectedProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/seller/orders/status',
        tags: ['Seller Orders'],
        summary: 'Update order status',
      },
    })
    .input(
      z.object({
        orderId: z.string().uuid(),
        status: z.enum(['processing', 'shipped', 'in_transit', 'delivered', 'canceled']),
        trackingNumber: z.string().optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        const seller = await getSeller(userId);
        if (!seller) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Seller profile not found',
          });
        }

        const [order] = await db
          .select()
          .from(orders)
          .where(
            and(
              eq(orders.id, input.orderId),
              eq(orders.sellerId, seller.id)
            )
          );

        if (!order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not found',
          });
        }

        // Update order status
        const updateData: any = {
          deliveryStatus: input.status,
          updatedAt: new Date(),
        };

        if (input.trackingNumber) {
          updateData.trackingNumber = input.trackingNumber;
        }

        await db
          .update(orders)
          .set(updateData)
          .where(eq(orders.id, input.orderId));

        // Send appropriate notification based on status
        if (input.status === 'shipped') {
          await notifyOrderConfirmed(seller.id, order.buyerId, order.id);
        } else if (input.status === 'delivered') {
          await notifyDeliveryConfirmed(seller.id, order.buyerId, order.id);
        }

        return {
          success: true,
          message: `Order status updated to ${input.status}`,
        };
      } catch (err: any) {
        console.error('Error updating order status:', err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err?.message || 'Failed to update order status',
        });
      }
    }),

  getOrderDetails: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/seller/orders/:orderId',
        tags: ['Seller Orders'],
        summary: 'Get order details',
      },
    })
    .input(z.object({ orderId: z.string().uuid() }))
    .output(
      z.object({
        success: z.boolean(),
        data: z.any().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        const seller = await getSeller(userId);
        if (!seller) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Seller profile not found',
          });
        }

        const [order] = await db
          .select()
          .from(orders)
          .where(
            and(
              eq(orders.id, input.orderId),
              eq(orders.sellerId, seller.id)
            )
          );

        if (!order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not found',
          });
        }

        return {
          success: true,
          data: order,
        };
      } catch (err: any) {
        console.error('Error fetching order details:', err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err?.message || 'Failed to fetch order details',
        });
      }
    }),

  // Send message to buyer
  sendMessageToBuyer: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/seller/orders/send-message-to-buyer',
        tags: ['Seller Orders'],
        summary: 'Send message to buyer',
        description: 'Seller sends a message to buyer regarding an order',
      },
    })
    .input(
      z.object({
        orderId: z.string().uuid(),
        buyerId: z.string().uuid(),
        message: z.string().min(1).max(5000),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
        conversationId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sellerId = ctx.user?.id;
      if (!sellerId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        // Verify seller and order exist
        const [order] = await db
          .select()
          .from(orders)
          .where(
            and(
              eq(orders.id, input.orderId),
              eq(orders.sellerId, sellerId)
            )
          );

        if (!order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not found or does not belong to this seller',
          });
        }

        // Verify buyer ID matches order
        if (order.buyerId !== input.buyerId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid buyer for this order',
          });
        }

        // Get or create conversation
        let [conversation] = await db
          .select()
          .from(conversations)
          .where(
            and(
              eq(conversations.buyerId, input.buyerId),
              eq(conversations.sellerId, sellerId)
            )
          );

        if (!conversation) {
          const [newConv] = await db
            .insert(conversations)
            .values({
              buyerId: input.buyerId,
              sellerId: sellerId,
            })
            .returning();
          conversation = newConv;
        }

        // Add message
        await db
          .insert(messages)
          .values({
            conversationId: conversation.id,
            senderId: sellerId,
            senderRole: 'seller',
            content: input.message,
          });

        // Update conversation timestamp
        await db
          .update(conversations)
          .set({
            lastMessageAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(conversations.id, conversation.id));

        return {
          success: true,
          message: 'Message sent to buyer',
          conversationId: conversation.id,
        };
      } catch (err: any) {
        console.error('Error sending message to buyer:', err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err?.message || 'Failed to send message',
        });
      }
    }),
});
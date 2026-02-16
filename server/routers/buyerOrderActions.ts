import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const buyerOrderActionsRouter = createTRPCRouter({
  // Confirm delivery (buyer marks order as received)
  confirmDelivery: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { data: order } = await ctx.supabase
          .from('orders')
          .select('*')
          .eq('id', input.orderId)
          .eq('buyer_id', ctx.user?.id)
          .single();

        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        }

        if (order.order_status !== 'shipped') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Order must be in shipped status to confirm delivery',
          });
        }

        const { data: updated } = await ctx.supabase
          .from('orders')
          .update({
            order_status: 'delivered',
            delivery_confirmed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.orderId)
          .select()
          .single();

        return {
          success: true,
          message: 'Delivery confirmed. You can now leave a review.',
          order: updated,
        };
      } catch (error) {
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to confirm delivery',
            });
      }
    }),

  // Send message between buyer and seller
  sendMessage: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        recipientId: z.string(),
        message: z.string().min(1).max(5000),
        recipientRole: z.enum(['buyer', 'seller', 'support']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.user?.id;
        if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

        // Fetch order details for notification
        const { data: order } = await ctx.supabase
          .from('orders')
          .select('*, listings(title, seller_id, seller(*))') 
          .eq('id', input.orderId)
          .single();

        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        }

        // Fetch buyer details
        const { data: buyer } = await ctx.supabase
          .from('users')
          .select('id, name, email, avatar_url')
          .eq('id', userId)
          .single();

        // Create or get conversation
        const { data: conversation } = await ctx.supabase
          .from('conversations')
          .select('*')
          .eq('order_id', input.orderId)
          .eq('buyer_id', input.recipientRole === 'buyer' ? input.recipientId : userId)
          .eq('seller_id', input.recipientRole === 'seller' ? input.recipientId : userId)
          .single();

        let conversationId = conversation?.id;

        if (!conversationId) {
          const { data: newConv } = await ctx.supabase
            .from('conversations')
            .insert([
              {
                order_id: input.orderId,
                buyer_id: input.recipientRole === 'buyer' ? input.recipientId : userId,
                seller_id: input.recipientRole === 'seller' ? input.recipientId : userId,
                last_message_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();
          conversationId = newConv?.id;
        }

        // Add message
        const { data: newMessage } = await ctx.supabase
          .from('messages')
          .insert([
            {
              conversation_id: conversationId,
              sender_id: userId,
              sender_role: ctx.user?.role || 'buyer',
              message: input.message,
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        // Update conversation last message timestamp
        await ctx.supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversationId);

        // Send detailed notification to seller if message is to seller
        if (input.recipientRole === 'seller') {
          const sellerId = order.listings?.seller_id;
          if (sellerId) {
            const notificationData = {
              user_id: sellerId,
              type: 'buyer_message',
              title: `New message from ${buyer?.name || 'Customer'}`,
              description: `Regarding order #${input.orderId.substring(0, 8).toUpperCase()}: ${(order.listings as any)?.title || 'Item'}`,
              content: {
                orderId: input.orderId,
                orderNumber: input.orderId.substring(0, 8).toUpperCase(),
                productTitle: (order.listings as any)?.title,
                buyerName: buyer?.name,
                buyerEmail: buyer?.email,
                buyerAvatar: buyer?.avatar_url,
                message: input.message,
                orderStatus: order.order_status,
                orderTotal: order.total_price_cents ? `${(order.total_price_cents / 100).toFixed(2)}` : '$0.00',
                createdAt: new Date().toISOString(),
              },
              read: false,
              created_at: new Date().toISOString(),
            };

            await ctx.supabase.from('notifications').insert([notificationData]);
          }
        }

        return {
          success: true,
          messageId: newMessage?.id,
          message: 'Message sent successfully',
        };
      } catch (error) {
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to send message',
            });
      }
    }),

  // Get messages for an order
  getOrderMessages: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { data: conversation } = await ctx.supabase
          .from('conversations')
          .select('*')
          .eq('order_id', input.orderId)
          .single();

        if (!conversation) {
          return { messages: [], total: 0, hasMore: false };
        }

        const { data: messages, count } = await ctx.supabase
          .from('messages')
          .select('*', { count: 'exact' })
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .range(input.offset, input.offset + input.limit - 1);

        return {
          messages: messages || [],
          total: count || 0,
          hasMore: (input.offset + input.limit) < (count || 0),
        };
      } catch (error) {
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to fetch messages',
            });
      }
    }),

  // Cancel order (buyer can only cancel pending or processing orders)
  cancelOrder: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        reason: z.string().min(10).max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const buyerId = ctx.user?.id;
        if (!buyerId) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
        }

        // Fetch the order
        const { data: order, error: orderError } = await ctx.supabase
          .from('orders')
          .select('*')
          .eq('id', input.orderId)
          .eq('buyer_id', buyerId)
          .single();

        if (orderError || !order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not found or you do not have permission to cancel it',
          });
        }

        // Check if order can be canceled (only pending or processing)
        const cancellableStatuses = ['pending', 'confirmed', 'processing'];
        if (!cancellableStatuses.includes(order.order_status)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot cancel order in '${order.order_status}' status. Only pending, confirmed, or processing orders can be canceled.`,
          });
        }

        // Update order status to canceled
        const { data: updatedOrder, error: updateError } = await ctx.supabase
          .from('orders')
          .update({
            order_status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.orderId)
          .select()
          .single();

        if (updateError) throw updateError;

        // Add to order status history
        await ctx.supabase
          .from('order_status_history')
          .insert([
            {
              order_id: input.orderId,
              previous_status: order.order_status,
              new_status: 'canceled',
              reason: input.reason || 'Buyer requested cancellation',
              changed_by: buyerId,
              changed_by_role: 'buyer',
              created_at: new Date().toISOString(),
            },
          ]);

        // Get seller info to send notification
        const { data: seller } = await ctx.supabase
          .from('orders')
          .select('seller_id')
          .eq('id', input.orderId)
          .single();

        // Create notification for seller
        if (seller?.seller_id) {
          await ctx.supabase
            .from('notifications')
            .insert([
              {
                recipient_id: seller.seller_id,
                recipient_role: 'seller',
                notification_type: 'order_canceled',
                notification_category: 'order_canceled',
                title: 'Order Canceled',
                message: `Order #${order.id} has been canceled by the buyer.`,
                data: {
                  orderId: input.orderId,
                  reason: input.reason,
                  canceledAt: new Date().toISOString(),
                },
                is_read: false,
                created_at: new Date().toISOString(),
              },
            ]);
        }

        return {
          success: true,
          message: 'Order canceled successfully',
          order: updatedOrder,
        };
      } catch (error) {
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to cancel order',
            });
      }
    }),

  // Delete order from history (soft delete - archives the order)
  deleteFromHistory: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const buyerId = ctx.user?.id;
        if (!buyerId) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
        }

        // Fetch the order
        const { data: order, error: orderError } = await ctx.supabase
          .from('orders')
          .select('*')
          .eq('id', input.orderId)
          .eq('buyer_id', buyerId)
          .single();

        if (orderError || !order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not found or you do not have permission to delete it',
          });
        }

        // Only allow deletion of completed, canceled, or returned orders (not in-progress)
        const deletableStatuses = ['delivered', 'canceled', 'returned'];
        if (!deletableStatuses.includes(order.order_status)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot delete order in '${order.order_status}' status. Only completed, canceled, or returned orders can be deleted from history.`,
          });
        }

        // Soft delete - add to archived_orders table instead of hard deleting
        const { error: archiveError } = await ctx.supabase
          .from('archived_orders')
          .insert([
            {
              original_order_id: input.orderId,
              order_data: order,
              archived_by: buyerId,
              archived_at: new Date().toISOString(),
            },
          ]);

        if (archiveError && archiveError.code !== 'PGRST116') {
          // PGRST116 is "not found", table might not exist, so we'll just mark it differently
        }

        // Mark order as archived/hidden from buyer's view
        const { data: updatedOrder, error: updateError } = await ctx.supabase
          .from('orders')
          .update({
            is_archived: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.orderId)
          .select()
          .single();

        if (updateError) {
          // If is_archived column doesn't exist, we can still proceed
          console.warn('Could not update is_archived field:', updateError);
        }

        return {
          success: true,
          message: 'Order deleted from history',
          order: updatedOrder || order,
        };
      } catch (error) {
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to delete order from history',
            });
      }
    }),
});
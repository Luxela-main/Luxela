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
});
import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '../db';
import { sellers } from '../db/schema';
import { eq } from 'drizzle-orm';

export const orderStatusRouter = createTRPCRouter({
  // Get order status
  getOrderStatus: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const { data: order, error } = await ctx.supabase
          .from('orders')
          .select('*')
          .eq('id', input.orderId)
          .single();

        if (error || !order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not found',
          });
        }

        const { data: history } = await ctx.supabase
          .from('order_status_history')
          .select('*')
          .eq('order_id', input.orderId)
          .order('created_at', { ascending: true });

        return {
          orderId: order.id,
          status: order.order_status,
          history: history || [],
          createdAt: order.created_at,
          updatedAt: order.updated_at,
        };
      } catch (error) {
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to fetch order status',
            });
      }
    }),

  // Get orders by status
  getOrdersByStatus: protectedProcedure
    .input(
      z.object({
        status: z.enum([
          'pending',
          'confirmed',
          'processing',
          'shipped',
          'delivered',
          'canceled',
        ]),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { data: orders, error, count } = await ctx.supabase
          .from('orders')
          .select('*', { count: 'exact' })
          .eq('order_status', input.status)
          .range(input.offset, input.offset + input.limit - 1)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return {
          orders: orders || [],
          count: count || 0,
          hasMore: (input.offset + input.limit) < (count || 0),
        };
      } catch (error) {
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to fetch orders',
            });
      }
    }),

  // Get pending orders for seller
  getPendingOrders: protectedProcedure
    .input(
      z.object({
        sellerId: z.string(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .output(
      z.object({
        orders: z.array(
          z.object({
            id: z.string(),
            orderId: z.string(),
            buyerId: z.string(),
            sellerId: z.string(),
            listingId: z.string().nullable(),
            productTitle: z.string(),
            productImage: z.string().nullable(),
            productCategory: z.string(),
            quantity: z.number(),
            amountCents: z.number(),
            currency: z.string(),
            orderStatus: z.string(),
            deliveryStatus: z.string().nullable(),
            payoutStatus: z.string().nullable(),
            paymentMethod: z.string().nullable(),
            buyerName: z.string().nullable(),
            buyerEmail: z.string().nullable(),
            shippingAddress: z.string().nullable(),
            createdAt: z.date(),
            updatedAt: z.date(),
          })
        ),
        total: z.number(),
        limit: z.number(),
        offset: z.number(),
        hasMore: z.boolean(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Verify seller authorization using Drizzle ORM
        if (ctx.user?.role !== 'admin') {
          // Get the seller record from PostgreSQL via Drizzle
          const sellerRecords = await db
            .select()
            .from(sellers)
            .where(eq(sellers.id, input.sellerId));

          if (sellerRecords.length === 0) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Seller account not found',
            });
          }

          const seller = sellerRecords[0];

          // Verify the authenticated user owns this seller account
          if (seller.userId !== ctx.user?.id) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Not authorized to view these orders',
            });
          }
        }

        // Fetch pending orders for this seller
        const { data: orders, error, count } = await ctx.supabase
          .from('orders')
          .select('*', { count: 'exact' })
          .eq('seller_id', input.sellerId)
          .eq('order_status', 'pending')
          .range(input.offset, input.offset + input.limit - 1)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return {
          orders: (orders || []).map((order) => ({
            id: order.id,
            orderId: order.id, // Map id to orderId for frontend
            buyerId: order.buyer_id,
            sellerId: order.seller_id,
            listingId: order.listing_id,
            productTitle: order.product_title,
            productImage: order.product_image,
            productCategory: order.product_category,
            quantity: 1, // Default to 1 if not available in current schema
            amountCents: order.amount_cents,
            currency: order.currency || 'USD',
            orderStatus: order.order_status,
            deliveryStatus: order.delivery_status,
            payoutStatus: order.payout_status,
            paymentMethod: order.payment_method,
            buyerName: order.customer_name,
            buyerEmail: order.customer_email,
            shippingAddress: order.shipping_address,
            createdAt: order.created_at ? new Date(order.created_at) : new Date(),
            updatedAt: order.updated_at ? new Date(order.updated_at) : new Date(),
          })),
          total: count || 0,
          limit: input.limit,
          offset: input.offset,
          hasMore: (input.offset + input.limit) < (count || 0),
        };
      } catch (error) {
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to fetch pending orders',
            });
      }
    }),

  // Get order by ID
  getOrderById: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const { data: order, error } = await ctx.supabase
          .from('orders')
          .select('*')
          .eq('id', input.orderId)
          .single();

        if (error || !order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not found',
          });
        }

        // Verify authorization
        if (ctx.user?.id !== order.seller_id && ctx.user?.id !== order.buyer_id && ctx.user?.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not authorized to view this order',
          });
        }

        return order;
      } catch (error) {
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to fetch order',
            });
      }
    }),

  // Get order stats
  getOrderStats: protectedProcedure
    .input(z.object({ sellerId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        // Verify authorization
        if (ctx.user?.id !== input.sellerId && ctx.user?.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not authorized',
          });
        }

        const { data: stats } = await ctx.supabase
          .from('orders')
          .select('order_status')
          .eq('seller_id', input.sellerId);

        const statusCounts = {
          pending: 0,
          confirmed: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          canceled: 0,
        };

        (stats || []).forEach((order: any) => {
          const status = order.order_status as keyof typeof statusCounts;
          if (status in statusCounts) {
            statusCounts[status]++;
          }
        });

        return statusCounts;
      } catch (error) {
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to fetch order stats',
            });
      }
    }),

  // Confirm order
  confirmOrder: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { data: order } = await ctx.supabase
          .from('orders')
          .select('*')
          .eq('id', input.orderId)
          .eq('seller_id', ctx.user?.id)
          .single();

        if (!order || order.order_status !== 'pending') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot confirm order',
          });
        }

        const { data: updated } = await ctx.supabase
          .from('orders')
          .update({ order_status: 'confirmed', updated_at: new Date().toISOString() })
          .eq('id', input.orderId)
          .select()
          .single();

        return updated;
      } catch (error) {
        throw error instanceof TRPCError
          ? error
          : new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to confirm order' });
      }
    }),

  // Cancel order
  cancelOrder: protectedProcedure
    .input(z.object({ orderId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { data: order } = await ctx.supabase
          .from('orders')
          .select('*')
          .eq('id', input.orderId)
          .eq('seller_id', ctx.user?.id)
          .single();

        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        }

        const { data: updated } = await ctx.supabase
          .from('orders')
          .update({ order_status: 'canceled', updated_at: new Date().toISOString() })
          .eq('id', input.orderId)
          .select()
          .single();

        return updated;
      } catch (error) {
        throw error instanceof TRPCError
          ? error
          : new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to cancel order' });
      }
    }),

  // Update order status
  updateOrderStatus: protectedProcedure
    .input(z.object({ orderId: z.string(), status: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { data: order } = await ctx.supabase
          .from('orders')
          .select('*')
          .eq('id', input.orderId)
          .eq('seller_id', ctx.user?.id)
          .single();

        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        }

        const { data: updated } = await ctx.supabase
          .from('orders')
          .update({ order_status: input.status, updated_at: new Date().toISOString() })
          .eq('id', input.orderId)
          .select()
          .single();

        return updated;
      } catch (error) {
        throw error instanceof TRPCError
          ? error
          : new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update order status' });
      }
    }),

  // Ship order
  shipOrder: protectedProcedure
    .input(z.object({ orderId: z.string(), trackingNumber: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { data: order } = await ctx.supabase
          .from('orders')
          .select('*')
          .eq('id', input.orderId)
          .eq('seller_id', ctx.user?.id)
          .single();

        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        }

        const { data: updated } = await ctx.supabase
          .from('orders')
          .update({
            order_status: 'shipped',
            tracking_number: input.trackingNumber || null,
            shipped_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.orderId)
          .select()
          .single();

        return updated;
      } catch (error) {
        throw error instanceof TRPCError
          ? error
          : new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to ship order' });
      }
    }),
});
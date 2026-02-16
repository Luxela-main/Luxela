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

  // Get all orders (admin only) without status filtering
  getAllOrders: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(100),
        offset: z.number().default(0),
        status: z.enum([
          'pending',
          'confirmed',
          'processing',
          'shipped',
          'delivered',
          'canceled',
          'returned',
        ]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Check if user is admin
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admins can view all orders',
          });
        }

        let query = ctx.supabase
          .from('orders')
          .select('*', { count: 'exact' });

        // If status is provided, filter by it; otherwise get all orders
        if (input.status) {
          query = query.eq('order_status', input.status);
        }

        const { data: orders, error, count } = await query
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
          'returned',
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
    .output(
      z.object({
        id: z.string(),
        buyer_id: z.string().nullable(),
        seller_id: z.string().nullable(),
        listing_id: z.string().nullable(),
        product_title: z.string().nullable(),
        product_image: z.string().nullable(),
        customer_name: z.string().nullable(),
        customer_email: z.string().nullable(),
        order_status: z.string(),
        delivery_status: z.string().nullable(),
        amount_cents: z.number(),
        currency: z.string().nullable(),
        shipping_address: z.string().nullable(),
        tracking_number: z.string().nullable(),
        order_date: z.coerce.date().nullable().catch(null),
        delivered_date: z.coerce.date().nullable().catch(null),
        payment_method: z.string().nullable(),
        payout_status: z.string().nullable(),
        product_category: z.string().nullable(),
        created_at: z.coerce.date().nullable().catch(null),
        updated_at: z.coerce.date().nullable().catch(null),
        shipped_at: z.coerce.date().nullable().catch(null),
        estimated_arrival: z.coerce.date().nullable().catch(null),
        quantity: z.number().nullable(),
        selected_size: z.string().nullable(),
        selected_color: z.string().nullable(),
        selected_color_hex: z.string().nullable(),
        recipient_email: z.string().nullable(),
        items: z.any().nullable(),
      })
    )
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

        // Verify authorization - user must be seller, buyer, or admin
        const isAuthorized =
          ctx.user?.id === order.seller_id ||
          ctx.user?.id === order.buyer_id ||
          ctx.user?.role === 'admin';

        if (!isAuthorized) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not authorized to view this order',
          });
        }

        // Ensure dates are strings for serialization
        let items = null;
        try {
          // Parse items if they're stored as JSON string
          if (order.items) {
            if (typeof order.items === 'string') {
              items = JSON.parse(order.items);
            } else if (Array.isArray(order.items)) {
              items = order.items;
            }
          }
        } catch (e) {
          console.error('Error parsing order items:', e);
          items = null;
        }

        const normalizedOrder = {
          ...order,
          items: items,
          order_date: order.order_date ? new Date(order.order_date).toISOString() : null,
          delivered_date: order.delivered_date ? new Date(order.delivered_date).toISOString() : null,
          created_at: order.created_at ? new Date(order.created_at).toISOString() : null,
          updated_at: order.updated_at ? new Date(order.updated_at).toISOString() : null,
          shipped_at: order.shipped_at ? new Date(order.shipped_at).toISOString() : null,
          estimated_arrival: order.estimated_arrival ? new Date(order.estimated_arrival).toISOString() : null,
        };

        return normalizedOrder;
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
  // DEPRECATED: Use orderConfirmationService.sellerConfirmOrder() instead
  // This endpoint is kept for backward compatibility but new code should use the service directly

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

  // Confirm delivery (buyer confirms receipt of order)
  confirmDelivery: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get the order
        const { data: order, error } = await ctx.supabase
          .from('orders')
          .select('*')
          .eq('id', input.orderId)
          .single();

        if (error || !order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        }

        // Verify the user is the buyer
        if (order.buyer_id !== ctx.user?.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only the buyer can confirm delivery',
          });
        }

        // Order must be in 'shipped' status
        if (order.order_status !== 'shipped') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Only shipped orders can be marked as delivered',
          });
        }

        // Update order status to 'delivered'
        const { data: updated } = await ctx.supabase
          .from('orders')
          .update({
            order_status: 'delivered',
            delivered_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.orderId)
          .select()
          .single();

        return {
          success: true,
          message: 'Order marked as delivered. You can now leave a review.',
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
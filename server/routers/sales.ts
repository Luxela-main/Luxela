import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '../db';
import { orders, sellers } from '../db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

const OrderFilterEnum = z.enum(['all', 'processing', 'shipped', 'delivered', 'canceled', 'returned']);

export const salesRouter = createTRPCRouter({
  getAllSales: protectedProcedure
    .input(z.object({ status: OrderFilterEnum }).optional())
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      try {
        const sellerRow = await db.select().from(sellers).where(eq(sellers.userId, userId));
        const seller = sellerRow[0];
        if (!seller) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Seller not found' });

        const status = input?.status ?? 'all';
        const rows = status === 'all'
          ? await db.select().from(orders).where(eq(orders.sellerId, seller.id))
          : await db.select().from(orders).where(and(eq(orders.sellerId, seller.id), eq(orders.orderStatus, status as any)));

        return rows.map((o) => ({
          orderId: o.id,
          product: o.productTitle,
          customer: o.customerName,
          orderDate: o.orderDate,
          paymentMethod: o.paymentMethod,
          amountCents: o.amountCents,
          currency: o.currency,
          payoutStatus: o.payoutStatus,
          deliveryStatus: o.deliveryStatus,
          orderStatus: o.orderStatus,
        }));
      } catch (err: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: err?.message || 'Failed to fetch sales' });
      }
    }),

  getSaleById: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      try {
        const sellerRow = await db.select().from(sellers).where(eq(sellers.userId, userId));
        const seller = sellerRow[0];
        if (!seller) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Seller not found' });

        const rows = await db.select().from(orders).where(and(eq(orders.id, input.orderId), eq(orders.sellerId, seller.id)));
        const order = rows[0];
        if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        return order;
      } catch (err: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: err?.message || 'Failed to fetch order' });
      }
    }),

  updateSale: protectedProcedure
    .input(z.object({
      orderId: z.string().uuid(),
      payoutStatus: z.enum(['in_escrow', 'processing', 'paid']).optional(),
      deliveryStatus: z.enum(['not_shipped', 'in_transit', 'delivered']).optional(),
      orderStatus: z.enum(['processing', 'shipped', 'delivered', 'canceled', 'returned']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      try {
        const sellerRow = await db.select().from(sellers).where(eq(sellers.userId, userId));
        const seller = sellerRow[0];
        if (!seller) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Seller not found' });

        const rows = await db.select().from(orders).where(and(eq(orders.id, input.orderId), eq(orders.sellerId, seller.id)));
        if (!rows[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });

        const [updated] = await db
          .update(orders)
          .set({
            payoutStatus: input.payoutStatus,
            deliveryStatus: input.deliveryStatus,
            orderStatus: input.orderStatus,
          })
          .where(eq(orders.id, input.orderId))
          .returning();

        return updated;
      } catch (err: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: err?.message || 'Failed to update order' });
      }
    }),

  deleteSale: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      try {
        const sellerRow = await db.select().from(sellers).where(eq(sellers.userId, userId));
        const seller = sellerRow[0];
        if (!seller) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Seller not found' });

        const rows = await db.select().from(orders).where(and(eq(orders.id, input.orderId), eq(orders.sellerId, seller.id)));
        if (!rows[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });

        await db.delete(orders).where(eq(orders.id, input.orderId));
        return { success: true };
      } catch (err: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: err?.message || 'Failed to delete order' });
      }
    }),
});

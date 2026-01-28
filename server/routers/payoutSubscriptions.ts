import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { db } from '../db';
import { orders, sales, financialLedger } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';

export const payoutSubscriptionsRouter = createTRPCRouter({
  /**
   * Get seller's financial dashboard data
   */
  getFinancialMetrics: protectedProcedure
    .input(
      z.object({
        sellerId: z.string().uuid(),
      })
    )
    .output(
      z.object({
        totalRevenueCents: z.number(),
        totalPayoutsCents: z.number(),
        pendingPayoutsCents: z.number(),
        totalTransactions: z.number(),
        currency: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify authorization
      if (ctx.user?.id !== input.sellerId && ctx.user?.role !== 'admin') {
        throw new Error('Not authorized to view financial metrics');
      }

      // Get all sales for seller
      const sellerSales = await db.query.sales.findMany({
        where: eq(sales.sellerId, input.sellerId),
      });

      // Get financial ledger entries
      const ledgerEntries = await db.query.financialLedger.findMany({
        where: eq(financialLedger.sellerId, input.sellerId),
      });

      // Calculate totals
      let totalRevenue = 0;
      let totalPayouts = 0;
      const currency = sellerSales.length > 0 ? sellerSales[0].currency : 'USD';

      for (const sale of sellerSales) {
        if (!sale.isRefunded) {
          totalRevenue += sale.totalCents;
        }
      }

      for (const entry of ledgerEntries) {
        if (entry.transactionType === 'payout' && entry.status === 'completed') {
          totalPayouts += entry.amountCents;
        }
      }

      const pendingPayouts = totalRevenue - totalPayouts;

      return {
        totalRevenueCents: totalRevenue,
        totalPayoutsCents: totalPayouts,
        pendingPayoutsCents: Math.max(0, pendingPayouts),
        totalTransactions: ledgerEntries.length,
        currency,
      };
    }),

  /**
   * Get recent order sales
   */
  getRecentSales: protectedProcedure
    .input(
      z.object({
        sellerId: z.string().uuid(),
        limit: z.number().default(20),
      })
    )
    .output(
      z.array(
        z.object({
          id: z.string(),
          orderId: z.string(),
          amountCents: z.number(),
          currency: z.string(),
          payoutStatus: z.enum(['in_escrow', 'processing', 'paid']),
          orderStatus: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'canceled', 'returned'] as const),
          createdAt: z.date(),
        })
      )
    )
    .query(async ({ input, ctx }) => {
      // Verify authorization
      if (ctx.user?.id !== input.sellerId && ctx.user?.role !== 'admin') {
        throw new Error('Not authorized to view sales');
      }

      const sellerOrders = await db.query.orders.findMany({
        where: eq(orders.sellerId, input.sellerId),
        orderBy: (orders) => desc(orders.createdAt),
        limit: input.limit,
      });

      return sellerOrders.map((order) => ({
        id: order.id,
        orderId: order.id.substring(0, 8),
        amountCents: order.amountCents,
        currency: order.currency,
        payoutStatus: order.payoutStatus as 'in_escrow' | 'processing' | 'paid',
        orderStatus: order.orderStatus as 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'canceled' | 'returned',
        createdAt: order.createdAt,
      }));
    }),

  /**
   * Get ledger transaction history
   */
  getTransactionHistory: protectedProcedure
    .input(
      z.object({
        sellerId: z.string().uuid(),
        limit: z.number().default(50),
      })
    )
    .output(
      z.array(
        z.object({
          id: z.string(),
          type: z.string(),
          amountCents: z.number(),
          currency: z.string(),
          status: z.string(),
          description: z.string().nullable(),
          createdAt: z.date(),
        })
      )
    )
    .query(async ({ input, ctx }) => {
      // Verify authorization
      if (ctx.user?.id !== input.sellerId && ctx.user?.role !== 'admin') {
        throw new Error('Not authorized to view transaction history');
      }

      const transactions = await db.query.financialLedger.findMany({
        where: eq(financialLedger.sellerId, input.sellerId),
        orderBy: (ledger) => desc(ledger.createdAt),
        limit: input.limit,
      });

      return transactions.map((tx) => ({
        id: tx.id,
        type: tx.transactionType,
        amountCents: tx.amountCents,
        currency: tx.currency,
        status: tx.status,
        description: tx.description,
        createdAt: tx.createdAt,
      }));
    }),
});
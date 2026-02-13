import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { db } from '@/server/db';
import { paymentHolds, orders, financialLedger } from '@/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

/**
 * Get seller's current escrow balance (funds in active holds)
 */
async function getSellerEscrowBalance(
  sellerId: string,
  currency: string
): Promise<number> {
  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${orders.amountCents}), 0)`.mapWith(Number),
    })
    .from(paymentHolds)
    .innerJoin(orders, eq(paymentHolds.orderId, orders.id))
    .where(
      and(
        eq(orders.sellerId, sellerId),
        eq(paymentHolds.holdStatus, 'active'),
        eq(orders.currency, currency)
      )
    );

  return result[0]?.total || 0;
}

/**
 * Get list of seller's active escrow holds with expiry info
 */
async function getSellerActiveHolds(
  sellerId: string,
  currency: string
): Promise<Array<{
  holdId: string;
  orderId: string;
  buyerId: string;
  amountCents: number;
  currency: string;
  holdCreatedAt: Date;
  status: string;
  daysRemaining: number;
  expiresAt: Date;
}>> {
  const holds = await db
    .select({
      holdId: paymentHolds.id,
      orderId: orders.id,
      buyerId: orders.buyerId,
      amountCents: orders.amountCents,
      currency: orders.currency,
      holdCreatedAt: paymentHolds.createdAt,
      status: paymentHolds.holdStatus,
    })
    .from(paymentHolds)
    .innerJoin(orders, eq(paymentHolds.orderId, orders.id))
    .where(
      and(
        eq(orders.sellerId, sellerId),
        eq(paymentHolds.holdStatus, 'active'),
        eq(orders.currency, currency)
      )
    );

  // Calculate days remaining for each hold
  return holds.map((hold: typeof holds[number]) => {
    const createdTime = hold.holdCreatedAt.getTime();
    const expiryTime = createdTime + 30 * 24 * 60 * 60 * 1000; // 30 days
    const nowTime = Date.now();
    const daysRemaining = Math.max(0, Math.ceil((expiryTime - nowTime) / (24 * 60 * 60 * 1000)));
    const expiresAt = new Date(expiryTime);

    return {
      ...hold,
      daysRemaining,
      expiresAt,
    };
  });
}

/**
 * Get seller's payout history
 */
async function getSellerPayoutHistory(
  sellerId: string,
  currency: string,
  limit: number = 50
) {
  return await db
    .select({
      id: financialLedger.id,
      orderId: financialLedger.orderId,
      amountCents: financialLedger.amountCents,
      currency: financialLedger.currency,
      status: financialLedger.status,
      description: financialLedger.description,
      transactionType: financialLedger.transactionType,
      createdAt: financialLedger.createdAt,
    })
    .from(financialLedger)
    .where(
      and(
        eq(financialLedger.sellerId, sellerId),
        eq(financialLedger.currency, currency)
      )
    )
    .orderBy(financialLedger.createdAt)
    .limit(limit);
}

export const escrowRouter = createTRPCRouter({
  /**
   * Get total funds currently in escrow for seller (active holds only)
   */
  getSellerEscrowBalance: protectedProcedure
    .input(z.object({ currency: z.string().default('NGN') }))
    .query(async ({ ctx, input }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          });
        }
        const balanceCents = await getSellerEscrowBalance(
          ctx.user.id,
          input.currency
        );
        return {
          balanceCents,
          balance: balanceCents / 100,
          currency: input.currency,
        };
      } catch (error) {
        console.error('Error fetching escrow balance:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch escrow balance',
        });
      }
    }),

  /**
   * Get list of all active escrow holds for seller with expiry dates
   */
  getSellerActiveHolds: protectedProcedure
    .input(z.object({ currency: z.string().default('NGN') }))
    .query(async ({ ctx, input }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          });
        }
        return await getSellerActiveHolds(ctx.user.id, input.currency);
      } catch (error) {
        console.error('Error fetching active holds:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch active holds',
        });
      }
    }),

  /**
   * Get seller's payout history (released/paid amounts)
   */
  getSellerPayoutHistory: protectedProcedure
    .input(
      z.object({
        currency: z.string().default('NGN'),
        limit: z.number().max(200).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          });
        }
        return await getSellerPayoutHistory(
          ctx.user.id,
          input.currency,
          input.limit
        );
      } catch (error) {
        console.error('Error fetching payout history:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch payout history',
        });
      }
    }),

  /**
   * Get comprehensive escrow summary for seller dashboard
   */
  getEscrowSummary: protectedProcedure
    .input(z.object({ currency: z.string().default('NGN') }))
    .query(async ({ ctx, input }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          });
        }
        const [balance, activeHolds, history] = await Promise.all([
          getSellerEscrowBalance(ctx.user.id, input.currency),
          getSellerActiveHolds(ctx.user.id, input.currency),
          getSellerPayoutHistory(ctx.user.id, input.currency, 10),
        ]);

        // Calculate total paid out from history
        const totalPaidOut = history
          .filter((h: typeof history[number]) => h.transactionType === 'payout' && h.status === 'completed')
          .reduce((sum: number, h: typeof history[number]) => sum + h.amountCents, 0);

        // Calculate upcoming releases (next 7 days)
        const upcomingReleases = activeHolds.filter((h: typeof activeHolds[number]) => h.daysRemaining <= 7);

        return {
          currentBalance: {
            balanceCents: balance,
            balance: balance / 100,
            currency: input.currency,
          },
          activeHolds: activeHolds.length,
          totalInEscrow: balance,
          upcomingReleases: upcomingReleases.length,
          totalPaidOut,
          totalPaidOutFormatted: totalPaidOut / 100,
          recentPayouts: history.slice(0, 5),
          holdDetails: activeHolds,
        };
      } catch (error) {
        console.error('Error fetching escrow summary:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch escrow summary',
        });
      }
    }),
});
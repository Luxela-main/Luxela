import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '../db';
import { scheduledPayouts, sellers } from '../db/schema';
import { eq } from 'drizzle-orm';
import {
  processAutomaticPayouts,
  getSellerPayoutBalance,
  getSellerPayoutHistory,
  requestManualPayout,
  getSellerEarningsStats,
} from '../services/automaticPayoutService';
import {
  handlePaymentSuccess,
  handlePaymentFailure,
  handleOrderShipped,
  handleOrderDelivered,
  handleRefundInitiated,
  getPaymentFlowStatus,
} from '../services/paymentFlowService';
import {
  getAvailablePayoutBalance,
  processImmediatePayout,
  processScheduledPayouts,
} from '../services/payoutExecutionService';

export const financeRouter = createTRPCRouter({
  getLedgerEntries: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        type: z.enum(['income', 'expense', 'refund']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
        });
      }

      const { data, error } = await ctx.supabase
        .from('financial_ledger')
        .select('*', { count: 'exact' })
        .eq('seller_id', ctx.user.id)
        .range(input.offset, input.offset + input.limit - 1)
        .order('created_at', { ascending: false });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }

      return {
        entries: data || [],
        total: data?.length || 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  getLedgerSummary: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
        });
      }

      const { data: entries, error } = await ctx.supabase
        .from('financial_ledger')
        .select('*')
        .eq('seller_id', ctx.user.id);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }

      const summary = (entries || []).reduce((acc: any, entry: any) => {
          if (entry.type === 'income') {
            acc.totalIncome += entry.amount;
          } else if (entry.type === 'expense') {
            acc.totalExpenses += entry.amount;
          } else if (entry.type === 'refund') {
            acc.totalRefunds += entry.amount;
          }
          return acc;
        },
        {
          totalIncome: 0,
          totalExpenses: 0,
          totalRefunds: 0,
        }
      );

      return {
        ...summary,
        balance: summary.totalIncome - summary.totalExpenses - summary.totalRefunds,
        entriesCount: entries?.length || 0,
      };
    }),

  getLedgerEntry: protectedProcedure
    .input(z.object({ entryId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
        });
      }

      const { data, error } = await ctx.supabase
        .from('financial_ledger')
        .select('*')
        .eq('id', input.entryId)
        .eq('seller_id', ctx.user.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ledger entry not found',
        });
      }

      return data;
    }),

  createLedgerEntry: protectedProcedure
    .input(
      z.object({
        type: z.enum(['income', 'expense', 'refund']),
        amount: z.number().min(0),
        description: z.string(),
        reference: z.string().optional(),
        referenceType: z.enum(['order', 'payment', 'refund', 'fee', 'adjustment']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
        });
      }

      const { data, error } = await ctx.supabase
        .from('financial_ledger')
        .insert({
          seller_id: ctx.user.id,
          type: input.type,
          amount: input.amount,
          description: input.description,
          reference: input.reference,
          reference_type: input.referenceType,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }

      return data;
    }),

  exportLedgerCSV: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
        });
      }

      const { data: entries, error } = await ctx.supabase
        .from('financial_ledger')
        .select('*')
        .eq('seller_id', ctx.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }

      const headers = ['Date', 'Type', 'Amount', 'Description', 'Reference'];
      const rows = (entries || []).map((entry) => [
        new Date(entry.created_at).toLocaleDateString(),
        entry.type,
        entry.amount.toString(),
        entry.description,
        entry.reference || '',
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

      return {
        content: csvContent,
        filename: `ledger_${new Date().getTime()}.csv`,
        format: 'csv',
      };
    }),

  getPayoutStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
        });
      }

      const { data: entries, error } = await ctx.supabase
        .from('financial_ledger')
        .select('*')
        .eq('seller_id', ctx.user.id);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }

      const stats = (entries || []).reduce((acc: any, entry: any) => {
          if (entry.transaction_type === 'income' && entry.status !== 'paid_out') {
            acc.availableBalance += entry.amount_cents / 100;
          }
          if (entry.status === 'paid_out') {
            acc.totalPaidOut += entry.amount_cents / 100;
          }
          if (entry.status === 'pending_payout') {
            acc.pendingPayouts += entry.amount_cents / 100;
          }
        },
        {
          availableBalance: 0,
          totalPaidOut: 0,
          pendingPayouts: 0,
          monthlyGrowthPercentage: 0,
        }
      );

      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      const thisMonthTotal = (entries || [])
        .filter((e) => new Date(e.created_at) >= new Date(now.getFullYear(), now.getMonth(), 1))
        .reduce((sum: any, e: any) => sum + (e.amount_cents / 100), 0);
      const lastMonthTotal = (entries || [])
        .filter((e) => {
          const d = new Date(e.created_at);
          return d >= lastMonth && d < new Date(now.getFullYear(), now.getMonth(), 1);
        })
        .reduce((sum: any, e: any) => sum + (e.amount_cents / 100), 0);

      stats.monthlyGrowthPercentage = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

      return stats;
    }),

  getPayoutHistory: protectedProcedure
    .input(
      z.object({
        month: z.string().optional(),
        year: z.number().optional(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
        });
      }

      const { data: entries, error } = await ctx.supabase
        .from('financial_ledger')
        .select('*')
        .eq('seller_id', ctx.user.id)
        .order('created_at', { ascending: false })
        .limit(input.limit);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }

      let filtered = entries || [];
      if (input.month || input.year) {
        filtered = filtered.filter((entry) => {
          const date = new Date(entry.created_at);
          if (input.year && date.getFullYear() !== input.year) return false;
          if (input.month && (date.getMonth() + 1).toString().padStart(2, '0') !== input.month) return false;
          return true;
        });
      }

      const history = filtered.map((entry) => ({
        id: entry.id,
        date: new Date(entry.created_at).toISOString().split('T')[0],
        type: entry.transaction_type,
        amount: (entry.amount_cents / 100).toFixed(2),
        amountCents: entry.amount_cents,
        description: entry.description || 'Transaction',
        status: entry.status,
        currency: entry.currency,
        method: 'Bank Transfer',
        reference: entry.id.slice(0, 8).toUpperCase(),
      }));

      return history;
    }),

  getPayoutBalance: protectedProcedure
    .input(
      z.object({
        currency: z.string().default('NGN'),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
        });
      }

      try {
        const balance = await getSellerPayoutBalance(ctx.user.id, input.currency);
        return {
          available: balance.available,
          pending: balance.pending,
          total: balance.total,
          currency: input.currency,
        };
      } catch (err: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err?.message || 'Failed to fetch payout balance',
        });
      }
    }),

  getEarningsStats: protectedProcedure
    .input(
      z.object({
        currency: z.string().default('NGN'),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
        });
      }

      try {
        const stats = await getSellerEarningsStats(ctx.user.id, input.currency);
        return {
          totalEarnings: stats.totalEarnings,
          totalPayedOut: stats.totalPayedOut,
          availableBalance: stats.availableBalance,
          pendingBalance: stats.pendingBalance,
          totalOrders: stats.totalOrders,
          totalRefunds: stats.totalRefunds,
          currency: input.currency,
        };
      } catch (err: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err?.message || 'Failed to fetch earnings statistics',
        });
      }
    }),

  requestPayout: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(50000),
        currency: z.string().default('NGN'),
        bankDetails: z.object({
          accountName: z.string(),
          accountNumber: z.string(),
          bankCode: z.string(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
        });
      }

      try {
        const result = await requestManualPayout(
          ctx.user.id,
          input.amount,
          input.currency,
          input.bankDetails
        );
        return result;
      } catch (err: any) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: err?.message || 'Failed to request payout',
        });
      }
    }),

  processPaymentSuccess: protectedProcedure
    .input(
      z.object({
        reference: z.string(),
        amount: z.number().optional(),
        currency: z.string().optional(),
        status: z.enum(['success', 'failed', 'pending', 'refunded']),
        metadata: z.record(z.string(), z.any()).optional(),
        timestamp: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
        });
      }

      try {
        await handlePaymentSuccess({
          id: input.reference,
          reference: input.reference,
          amount: input.amount,
          currency: input.currency,
          status: input.status,
          metadata: input.metadata,
          timestamp: input.timestamp,
        });
        return { success: true, message: 'Payment processed successfully' };
      } catch (err: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err?.message || 'Failed to process payment',
        });
      }
    }),

  processOrderDelivered: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
        });
      }

      try {
        await handleOrderDelivered(input.orderId);
        return { success: true, message: 'Order marked as delivered' };
      } catch (err: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err?.message || 'Failed to process delivery',
        });
      }
    }),

  getPaymentFlowDetails: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
        });
      }

      try {
        const flowStatus = await getPaymentFlowStatus(input.orderId);
        return {
          order: flowStatus.order,
          payment: flowStatus.payment,
          hold: flowStatus.hold,
          ledgerEntries: flowStatus.ledgerEntries,
        };
      } catch (err: any) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: err?.message || 'Order not found',
        });
      }
    }),

  schedulePayoutCreate: protectedProcedure
    .input(
      z.object({
        amountCents: z.number().min(1000),
        payoutMethodId: z.string(),
        schedule: z.enum(['immediate', 'daily', 'weekly', 'bi_weekly', 'monthly']),
        scheduledDate: z.date().optional(),
        frequency: z.string().optional(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });
      try {
        const sellerRow = await db.select().from(sellers).where(eq(sellers.userId, ctx.user.id));
        const seller = sellerRow[0];
        if (!seller) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Seller not found' });

        const nextScheduledAt =
          input.schedule === 'immediate'
            ? new Date()
            : input.schedule === 'daily'
              ? new Date(Date.now() + 24 * 60 * 60 * 1000)
              : input.schedule === 'weekly'
                ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                : input.schedule === 'bi_weekly'
                  ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                  : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const [payout] = await db
          .insert(scheduledPayouts)
          .values({
            sellerId: seller.id,
            amountCents: input.amountCents,
            payoutMethodId: input.payoutMethodId,
            schedule: input.schedule,
            scheduledDate: input.scheduledDate,
            frequency: input.frequency || input.schedule,
            status: 'pending',
            nextScheduledAt,
            note: input.note,
          })
          .returning();

        return payout;
      } catch (err: any) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: err?.message || 'Failed to schedule payout',
        });
      }
    }),

  scheduledPayoutsGet: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });
    try {
      const sellerRow = await db.select().from(sellers).where(eq(sellers.userId, ctx.user.id));
      const seller = sellerRow[0];
      if (!seller) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Seller not found' });

      const payouts = await db.select().from(scheduledPayouts).where(eq(scheduledPayouts.sellerId, seller.id));

      return payouts.map((p: any) => ({
        id: p.id,
        amountCents: p.amountCents,
        amount: p.amountCents / 100,
        currency: p.currency,
        payoutMethodId: p.payoutMethodId,
        schedule: p.schedule,
        status: p.status,
        nextScheduledAt: p.nextScheduledAt,
        createdAt: p.createdAt,
      }));
    } catch (err: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: err?.message || 'Failed to fetch scheduled payouts',
      });
    }
  }),

  scheduledPayoutCancel: protectedProcedure
    .input(z.object({ payoutId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });
      try {
        const sellerRow = await db.select().from(sellers).where(eq(sellers.userId, ctx.user.id));
        const seller = sellerRow[0];
        if (!seller) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Seller not found' });

        await db
          .delete(scheduledPayouts)
          .where(eq(scheduledPayouts.id, input.payoutId));

        return { success: true };
      } catch (err: any) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: err?.message || 'Failed to cancel payout',
        });
      }
    }),
});
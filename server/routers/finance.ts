import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const financeRouter = createTRPCRouter({
  // Get all ledger entries with pagination
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

  // Get ledger summary (total income, expenses, balance)
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

      const summary = (entries || []).reduce(
        (acc, entry) => {
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

  // Get specific ledger entry details
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

  // Record a new ledger entry
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

  // Export ledger to CSV
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

      // Generate CSV content
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

  // Get payout statistics (total pending, processed)
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

      const stats = (entries || []).reduce(
        (acc, entry) => {
          if (entry.type === 'income') {
            acc.totalPending += entry.amount;
          } else if (entry.reference_type === 'payout') {
            acc.totalProcessed += entry.amount;
          }
          return acc;
        },
        {
          totalPending: 0,
          totalProcessed: 0,
          totalEarnings: 0,
        }
      );

      stats.totalEarnings = stats.totalPending + stats.totalProcessed;

      return stats;
    }),

  // Get payout history with filters
  getPayoutHistory: protectedProcedure
    .input(
      z.object({
        month: z.string().optional(),
        year: z.number().optional(),
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
        date: new Date(entry.created_at).toISOString().split('T')[0],
        type: entry.type,
        amount: entry.amount,
        description: entry.description,
        status: entry.reference_type === 'payout' ? 'processed' : 'pending',
      }));

      return history;
    }),
});
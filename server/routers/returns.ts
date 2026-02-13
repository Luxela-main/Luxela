import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { db } from '../db';
import { orders, sellers, sellerNotifications, refunds } from '../db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { TRPCContext } from '../trpc/context';

// Zod schemas
const returnReasonEnum = z.enum([
  'defective',
  'damaged',
  'not_as_described',
  'unwanted',
  'too_small',
  'too_large',
  'color_mismatch',
  'wrong_item',
  'other',
]);

const returnStatusEnum = z.enum([
  'requested',
  'approved',
  'rejected',
  'in_transit',
  'received',
  'inspected',
  'completed',
  'canceled',
]);

const refundStatusEnum = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'partial',
  'canceled',
]);

export const returnsRouter = createTRPCRouter({
  /**
   * Get all return requests for a seller
   */
  getReturnRequests: protectedProcedure
    .input(
      z.object({
        status: returnStatusEnum.optional(),
        limit: z.number().max(50).default(20),
        offset: z.number().default(0),
      })
    )
    .query(async (opts: any) => {
      const { ctx, input } = opts as { ctx: TRPCContext; input: { status?: string | undefined; limit: number; offset: number } };
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        // Get seller ID
        const sellerRow = await db
          .select()
          .from(sellers)
          .where(eq(sellers.userId, userId));

        if (!sellerRow.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Seller not found',
          });
        }

        const sellerId = sellerRow[0].id;

        // For now, return empty array
        // This would be populated by a returns table in production
        // TODO: Implement returns table in database schema
        return [];
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch return requests',
        });
      }
    }),

  /**
   * Get a specific return request
   */
  getReturnRequest: protectedProcedure
    .input(z.object({ returnId: z.string() }))
    .query(async (opts: any) => {
      const { ctx, input } = opts as { ctx: TRPCContext; input: { returnId: string } };
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        // TODO: Implement when returns table exists
        return null;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch return request',
        });
      }
    }),

  /**
   * Create a return request (initiated by buyer, received by seller)
   * Used by the order detail page to request returns/refunds
   */
  requestReturn: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        reason: returnReasonEnum,
        reasonDescription: z.string().min(10).max(500),
      })
    )
    .mutation(async (opts: any) => {
      const { ctx, input } = opts as { ctx: TRPCContext; input: { orderId: string; reason: string; reasonDescription: string } };
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        // 1. Fetch order and verify it exists and buyer owns it
        const order = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId));

        if (!order.length) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not found',
          });
        }

        const orderData = order[0];
        // refunds and sellerNotifications already imported at the top

        // 2. Create refund request in database
        const refundId = require('uuid').v4();
        await db.insert(refunds).values({
          id: refundId,
          orderId: input.orderId,
          buyerId: orderData.buyerId,
          sellerId: orderData.sellerId,
          amountCents: orderData.amountCents,
          currency: orderData.currency,
          refundType: 'full',
          reason: input.reason,
          refundStatus: 'return_requested',
          description: input.reasonDescription,
          requestedAt: new Date(),
        });

        // 3. Notify seller about return request
        const seller = await db
          .select()
          .from(sellers)
          .where(eq(sellers.id, orderData.sellerId));

        if (seller.length > 0) {
          // Create seller notification
          await db.insert(sellerNotifications).values({
            id: require('uuid').v4(),
            sellerId: orderData.sellerId,
            orderId: input.orderId,
            type: 'return_initiated',
            title: 'Return Request',
            message: `Buyer has requested a return for order ${orderData.orderId}. Reason: ${input.reason}`,
            status: 'unread',
            createdAt: new Date(),
          });
        }

        return {
          id: refundId,
          orderId: input.orderId,
          status: 'return_requested',
          createdAt: new Date(),
          message: 'Return request submitted successfully. Seller will review within 24-48 hours.',
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create return request',
        });
      }
    }),

  /**
   * Approve a return request
   */
  approveReturn: protectedProcedure
    .input(
      z.object({
        returnId: z.string(),
        returnShippingLabel: z.string().url().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async (opts: any) => {
      const { ctx, input } = opts as { ctx: TRPCContext; input: { returnId: string; returnShippingLabel?: string; notes?: string } };
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        // TODO: Implement in production
        // 1. Verify seller owns this return
        // 2. Update return status to 'approved'
        // 3. Send return label to buyer
        // 4. Notify buyer via email

        return {
          id: input.returnId,
          status: 'approved',
          returnShippingLabel: input.returnShippingLabel,
          approvedAt: new Date(),
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to approve return',
        });
      }
    }),

  /**
   * Reject a return request
   */
  rejectReturn: protectedProcedure
    .input(
      z.object({
        returnId: z.string(),
        reason: z.string().min(10).max(500),
      })
    )
    .mutation(async (opts: any) => {
      const { ctx, input } = opts as { ctx: TRPCContext; input: { returnId: string; reason: string } };
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        // TODO: Implement in production
        // 1. Verify seller owns this return
        // 2. Update return status to 'rejected'
        // 3. Notify buyer about rejection

        return {
          id: input.returnId,
          status: 'rejected',
          rejectedAt: new Date(),
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reject return',
        });
      }
    }),

  /**
   * Confirm receipt of returned item
   */
  confirmReturnReceipt: protectedProcedure
    .input(
      z.object({
        returnId: z.string(),
        trackingNumber: z.string(),
        inspectionNotes: z.string().optional(),
      })
    )
    .mutation(async (opts: any) => {
      const { ctx, input } = opts as { ctx: TRPCContext; input: { returnId: string; trackingNumber: string; inspectionNotes?: string } };
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        // TODO: Implement in production
        // 1. Verify seller owns this return
        // 2. Update return status to 'received'
        // 3. Mark for inspection if required
        // 4. Create refund if auto-approved

        return {
          id: input.returnId,
          status: 'received',
          receivedAt: new Date(),
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to confirm return receipt',
        });
      }
    }),

  /**
   * Process refund for approved return
   */
  processRefund: protectedProcedure
    .input(
      z.object({
        returnId: z.string(),
        refundAmount: z.number().positive(),
        refundMethod: z.enum(['original_payment', 'store_credit']),
      })
    )
    .mutation(async (opts: any) => {
      const { ctx, input } = opts as { ctx: TRPCContext; input: { returnId: string; refundAmount: number; refundMethod: string } };
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        // TODO: Implement in production
        // 1. Verify seller owns this return
        // 2. Validate refund amount
        // 3. Process payment reversal or store credit
        // 4. Update refund status
        // 5. Notify buyer about refund

        return {
          id: input.returnId,
          refundStatus: 'processing',
          refundAmount: input.refundAmount,
          refundProcessedAt: new Date(),
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process refund',
        });
      }
    }),

  /**
   * Cancel a return request
   */
  cancelReturn: protectedProcedure
    .input(
      z.object({
        returnId: z.string(),
        reason: z.string().min(10).max(500),
      })
    )
    .mutation(async (opts: any) => {
      const { ctx, input } = opts as { ctx: TRPCContext; input: { returnId: string; reason: string } };
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        // TODO: Implement in production
        return {
          id: input.returnId,
          status: 'canceled',
          canceledAt: new Date(),
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to cancel return',
        });
      }
    }),

  /**
   * Get return statistics for dashboard
   */
  getReturnStats: protectedProcedure.query(async (opts: any) => {
    const { ctx } = opts as { ctx: TRPCContext };
    const userId = ctx.user?.id;
    if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    try {
      // TODO: Calculate from returns table
      return {
        totalRequests: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        completed: 0,
        canceled: 0,
        totalRefunded: 0,
        averageRefundAmount: 0,
        approvalRate: 0,
        completionRate: 0,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch return statistics',
      });
    }
  }),
});
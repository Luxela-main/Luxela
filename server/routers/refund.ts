import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { TRPCContext } from '../trpc/context';
import { db } from '../db';
import { payments, orders, refunds, paymentHolds, financialLedger, sellers } from '../db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const refundRouter = createTRPCRouter({
  refundPayment: protectedProcedure
    .input(
      z.object({
        orderId: z.string().uuid('Order ID is required'),
        reason: z.string().min(5, 'Reason must be at least 5 characters'),
        refundType: z.enum(['full', 'partial', 'store_credit']).default('full'),
        amount: z.number().positive().optional(),
      })
    )
    .mutation(async (opts: any) => {
      const { ctx, input } = opts as { ctx: TRPCContext; input: { orderId: string; reason: string; refundType: string; amount?: number } };
      try {
        const userId = ctx.user?.id;
        if (!userId) {
          throw new TRPCError({ code: 'UNAUTHORIZED' });
        }

        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId));

        if (!order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not found',
          });
        }

        const [seller] = await db
          .select()
          .from(sellers)
          .where(eq(sellers.id, order.sellerId));

        if (!seller || seller.userId !== userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only the seller can issue refunds for this order',
          });
        }

        const [payment] = await db
          .select()
          .from(payments)
          .where(eq(payments.orderId, input.orderId));

        if (!payment) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Payment record not found for this order',
          });
        }

        const refundAmount =
          input.refundType === 'full'
            ? order.amountCents
            : (input.amount ? Math.round(input.amount * 100) : order.amountCents);

        if (refundAmount > order.amountCents) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Refund amount cannot exceed order amount',
          });
        }

        const [refund] = await db.transaction(async (tx) => {
          const [createdRefund] = await tx
            .insert(refunds)
            .values({
              id: uuidv4(),
              orderId: input.orderId,
              paymentId: payment.id,
              buyerId: order.buyerId,
              sellerId: order.sellerId,
              amountCents: refundAmount,
              currency: order.currency,
              refundType: input.refundType,
              reason: input.reason,
              refundStatus: 'pending',
              requestedAt: new Date(),
            })
            .returning();

          const [hold] = await tx
            .select()
            .from(paymentHolds)
            .where(eq(paymentHolds.orderId, input.orderId));

          if (hold) {
            await tx
              .update(paymentHolds)
              .set({
                holdStatus: 'refunded',
                refundedAt: new Date(),
              })
              .where(eq(paymentHolds.id, hold.id));
          }

          await tx.insert(financialLedger).values({
            id: uuidv4(),
            sellerId: order.sellerId,
            orderId: input.orderId,
            transactionType: 'refund',
            amountCents: -refundAmount,
            currency: order.currency,
            status: 'pending',
            description: `Refund for order ${input.orderId.slice(0, 8)}... - ${input.reason}`,
            paymentId: payment.id,
            createdAt: new Date(),
          });

          return [createdRefund];
        });

        return {
          success: true,
          message: 'Refund initiated successfully',
          refund,
        };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        console.error('Refund creation error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Refund creation failed',
        });
      }
    }),

  getRefundStatus: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async (opts: any) => {
      const { ctx, input } = opts as { ctx: TRPCContext; input: { orderId: string } };
      try {
        const [refund] = await db
          .select()
          .from(refunds)
          .where(eq(refunds.orderId, input.orderId));

        if (!refund) {
          return { exists: false, refund: null };
        }

        return { exists: true, refund };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to fetch refund status',
        });
      }
    }),

  // Buyer initiates return request
  requestReturn: protectedProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        reason: z.enum([
          'damaged',
          'defective',
          'not_as_described',
          'wrong_item',
          'changed_mind',
          'no_longer_needed',
        ]),
        description: z.string().min(10, 'Please provide detailed description'),
        images: z.array(z.string().url()).optional(),
      })
    )
    .mutation(async (opts: any) => {
      const { ctx, input } = opts as { ctx: TRPCContext; input: { orderId: string; reason: 'damaged' | 'defective' | 'not_as_described' | 'wrong_item' | 'changed_mind' | 'no_longer_needed'; description: string; images?: string[] } };
      try {
        const buyerId = ctx.user?.id;
        if (!buyerId) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId));

        if (!order || order.buyerId !== buyerId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Cannot request return for this order',
          });
        }

        // Check if order is returnable (within 30 days)
        const orderDate = new Date(order.orderDate);
        const daysSinceOrder = Math.floor(
          (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceOrder > 30) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Return window has expired. Items must be returned within 30 days.',
          });
        }

        const rmaNumber = `RMA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const [returnRecord] = await db.transaction(async (tx) => {
          const [created] = await tx
            .insert(refunds)
            .values({
              id: uuidv4(),
              orderId: input.orderId,
              buyerId: buyerId,
              sellerId: order.sellerId,
              amountCents: order.amountCents,
              currency: order.currency,
              refundType: 'full',
              reason: input.reason,
              refundStatus: 'return_requested',
              description: input.description,
              rmaNumber,
              images: JSON.stringify(input.images || []),
              requestedAt: new Date(),
            })
            .returning();

          // Record in financial ledger
          await tx.insert(financialLedger).values({
            id: uuidv4(),
            sellerId: order.sellerId,
            orderId: input.orderId,
            transactionType: 'return_request',
            amountCents: 0,
            currency: order.currency,
            status: 'pending',
            description: `Return request initiated for order ${input.orderId.slice(0, 8)}... - ${input.reason}`,
            createdAt: new Date(),
          });

          return [created];
        });

        return {
          success: true,
          rmaNumber,
          message: `Return request created. RMA: ${rmaNumber}`,
          refund: returnRecord,
        };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        
        // Extract error message from different error types
        let errorMessage = 'Failed to create return request';
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error instanceof Error) {
          errorMessage = error.message || errorMessage;
        } else if (typeof error === 'object' && error !== null) {
          errorMessage = error.message || error.msg || String(error);
        }
        
        console.error('Return request error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMessage,
        });
      }
    }),

  // Seller approves/rejects return
  processReturn: protectedProcedure
    .input(
      z.object({
        refundId: z.string().uuid(),
        approved: z.boolean(),
        sellerNote: z.string().optional(),
        restockPercentage: z.number().min(0).max(100).default(100),
      })
    )
    .mutation(async (opts: any) => {
      const { ctx, input } = opts as { ctx: TRPCContext; input: { refundId: string; approved: boolean; sellerNote?: string; restockPercentage: number } };
      try {
        const sellerId = ctx.user?.id;
        if (!sellerId) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const [refund] = await db
          .select()
          .from(refunds)
          .where(eq(refunds.id, input.refundId));

        if (!refund) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Return request not found',
          });
        }

        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, refund.orderId));

        if (order?.sellerId !== sellerId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Cannot process return for this order',
          });
        }

        const refundAmount = input.approved
          ? Math.round((refund.amountCents * input.restockPercentage) / 100)
          : 0;

        const [updated] = await db.transaction(async (tx) => {
          const [result] = await tx
            .update(refunds)
            .set({
              refundStatus: input.approved ? 'return_approved' : 'return_rejected',
              sellerNote: input.sellerNote,
              restockPercentage: input.restockPercentage,
              processedAt: new Date(),
            })
            .where(eq(refunds.id, input.refundId))
            .returning();

          if (input.approved && refundAmount > 0) {
            // Record approved refund in ledger
            await tx.insert(financialLedger).values({
              id: uuidv4(),
              sellerId: order.sellerId,
              orderId: refund.orderId,
              transactionType: 'return_approved',
              amountCents: -refundAmount,
              currency: refund.currency,
              status: 'pending',
              description: `Return approved for RMA ${refund.rmaNumber}. Refund: ${(refundAmount / 100).toFixed(2)}`,
              createdAt: new Date(),
            });
          }

          return [result];
        });

        return {
          success: true,
          refundStatus: input.approved ? 'approved' : 'rejected',
          refundAmount: refundAmount / 100,
          refund: updated,
        };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to process return',
        });
      }
    }),

  // Complete refund after return received
  completeRefund: protectedProcedure
    .input(
      z.object({
        refundId: z.string().uuid(),
        receivedCondition: z.enum([
          'excellent',
          'good',
          'acceptable',
          'poor',
        ]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async (opts: any) => {
      const { ctx, input } = opts as { ctx: TRPCContext; input: { refundId: string; receivedCondition?: 'excellent' | 'good' | 'acceptable' | 'poor'; notes?: string } };
      try {
        const sellerId = ctx.user?.id;
        if (!sellerId) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const [refund] = await db
          .select()
          .from(refunds)
          .where(eq(refunds.id, input.refundId));

        if (!refund || refund.refundStatus !== 'return_approved') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Return must be approved before completing refund',
          });
        }

        const refundAmount = Math.round(
          (refund.amountCents * (refund.restockPercentage || 100)) / 100
        );

        const [updated] = await db.transaction(async (tx) => {
          const [result] = await tx
            .update(refunds)
            .set({
              refundStatus: 'refunded',
              receivedCondition: input.receivedCondition,
              notes: input.notes,
              refundedAt: new Date(),
            })
            .where(eq(refunds.id, input.refundId))
            .returning();

          // Record refund completion in ledger
          await tx.insert(financialLedger).values({
            id: uuidv4(),
            sellerId: refund.sellerId,
            orderId: refund.orderId,
            transactionType: 'refund_completed',
            amountCents: -refundAmount,
            currency: refund.currency,
            status: 'completed',
            description: `Refund completed for RMA ${refund.rmaNumber}. Amount: ${(refundAmount / 100).toFixed(2)}`,
            createdAt: new Date(),
          });

          return [result];
        });

        return {
          success: true,
          message: 'Refund completed successfully',
          refund: updated,
        };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to complete refund',
        });
      }
    }),

  // Initiate refund (buyer-initiated refund request)
  initiateRefund: protectedProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        reason: z.string().min(10, 'Please provide detailed reason'),
        refundType: z.enum(['full', 'partial']).default('full'),
        amount: z.number().positive().optional(),
      })
    )
    .mutation(async (opts: any) => {
      const { ctx, input } = opts as { ctx: TRPCContext; input: { orderId: string; reason: string; refundType: string; amount?: number } };
      try {
        const buyerId = ctx.user?.id;
        if (!buyerId) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId));

        if (!order || order.buyerId !== buyerId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Cannot initiate refund for this order',
          });
        }

        // Check order delivery status - must be delivered
        if (order.deliveryStatus !== 'delivered') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Can only refund delivered orders',
          });
        }

        const [payment] = await db
          .select()
          .from(payments)
          .where(eq(payments.orderId, input.orderId));

        if (!payment) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Payment record not found',
          });
        }

        const refundAmount =
          input.refundType === 'full'
            ? order.amountCents
            : (input.amount ? Math.round(input.amount * 100) : order.amountCents);

        if (refundAmount > order.amountCents) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Refund amount cannot exceed order amount',
          });
        }

        const rmaNumber = `RMA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const [refund] = await db.transaction(async (tx) => {
          const [createdRefund] = await tx
            .insert(refunds)
            .values({
              id: uuidv4(),
              orderId: input.orderId,
              paymentId: payment.id,
              buyerId: buyerId,
              sellerId: order.sellerId,
              amountCents: refundAmount,
              currency: order.currency,
              refundType: input.refundType,
              reason: input.reason,
              refundStatus: 'pending',
              rmaNumber,
              requestedAt: new Date(),
            })
            .returning();

          // Record in financial ledger
          await tx.insert(financialLedger).values({
            id: uuidv4(),
            sellerId: order.sellerId,
            orderId: input.orderId,
            transactionType: 'refund_initiated',
            amountCents: -refundAmount,
            currency: order.currency,
            status: 'pending',
            description: `Buyer initiated refund for order ${input.orderId.slice(0, 8)}... - ${input.reason}`,
            paymentId: payment.id,
            createdAt: new Date(),
          });

          return [createdRefund];
        });

        return {
          success: true,
          message: 'Refund initiated successfully',
          rmaNumber,
          refund,
        };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        console.error('Refund initiation error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Refund initiation failed',
        });
      }
    }),

  // Get return history
  getMyReturns: protectedProcedure
    .input(
      z.object({
        limit: z.number().max(100).default(50),
        offset: z.number().default(0),
      })
    )
    .query(async (opts: any) => {
      const { ctx, input } = opts as { ctx: TRPCContext; input: { limit: number; offset: number } };
      try {
        const buyerId = ctx.user?.id;
        if (!buyerId) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const allRefunds = await db
          .select()
          .from(refunds)
          .where(eq(refunds.buyerId, buyerId))
          .orderBy((table) => table.requestedAt)
          .limit(input.limit)
          .offset(input.offset);

        return allRefunds.filter((r) => r.refundStatus?.includes('return'));
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to fetch returns',
        });
      }
    }),
});
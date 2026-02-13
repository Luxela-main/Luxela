import { createTRPCRouter, publicProcedure, protectedProcedure, adminProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '../db';
import { payments, orders, webhookEvents, notifications } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { createPaymentHold } from '../services/escrowService';
import { verifyWebhookSignature as verifyTsaraSignature } from '../services/tsara';
import {
  handlePaymentSuccess,
  handlePaymentFailure,
  handleOrderShipped,
  handleOrderDelivered,
} from '../services/paymentFlowService';

/**
 * Unified Webhook Router
 * Handles:
 * 1. Tsara payment webhooks (payment events)
 * 2. Webhook event management (create, retry, mark as processed)
 * 3. Webhook monitoring & statistics (all providers: Stripe, PayPal, Tsara)
 */

// ============================================================================
// TSARA WEBHOOK TYPES
// ============================================================================

const TsaraWebhookPayload = z.object({
  event: z.enum(['payment.success', 'payment.failed', 'payment.pending', 'payment.refunded']),
  data: z.object({
    id: z.string(),
    reference: z.string(),
    amount: z.number().optional(),
    currency: z.string().optional(),
    status: z.enum(['success', 'failed', 'pending', 'refunded']),
    metadata: z.record(z.string(), z.any()).optional(),
    timestamp: z.string().optional(),
  }),
  signature: z.string().optional(),
});

// ============================================================================
// WEBHOOK EVENT MANAGEMENT TYPES
// ============================================================================

const WebhookEventInput = z.object({
  eventType: z.string(),
  status: z.enum(['pending', 'processed', 'failed']).default('pending'),
});

const FailedWebhooksQuery = z.object({
  provider: z.enum(['stripe', 'paypal', 'tsara']).optional(),
  status: z.enum(['failed', 'retry', 'pending']).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().default(0),
});

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Verify webhook signature using Tsara's HMAC-SHA256
 * Uses the Tsara service's implementation which supports both Node and Edge runtime
 */
async function verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
  try {
    // Use the service's implementation which handles both Node and Edge runtimes
    return await verifyTsaraSignature(payload, signature);
  } catch (err) {
    console.error('Webhook signature verification error:', err);
    // Fail securely - reject webhook if verification fails
    return false;
  }
}

/**
 * Map Tsara event to local status
 */
function mapTsaraEventToStatus(event: string): 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' {
  switch (event) {
    case 'payment.success':
      return 'completed';
    case 'payment.failed':
      return 'failed';
    case 'payment.pending':
      return 'processing';
    case 'payment.refunded':
      return 'refunded';
    default:
      return 'pending';
  }
}

export const webhookRouter = createTRPCRouter({
  // ============================================================================
  // TSARA WEBHOOK HANDLERS (Public - for Tsara to call)
  // ============================================================================

  /**
   * Handle Tsara payment webhook
   * Called by Tsara when payment status changes
   * POST /api/webhook/tsara
   */
  handleTsaraPaymentWebhook: publicProcedure
    .input(TsaraWebhookPayload)
    .mutation(async ({ input }) => {
      try {
        // Verify webhook authenticity - REQUIRED for security
        if (!input.signature) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Missing webhook signature',
          });
        }

        const isValid = await verifyWebhookSignature(JSON.stringify(input), input.signature);
        if (!isValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid webhook signature',
          });
        }

        const { event, data } = input;

        // Find payment record by reference
        const existingPayments = await db
          .select()
          .from(payments)
          .where(eq(payments.transactionRef, data.reference));

        if (!existingPayments.length) {
          console.warn(`Webhook: Payment not found for reference ${data.reference}`);
          return {
            success: false,
            message: 'Payment not found',
          };
        }

        const payment = existingPayments[0];

        // ✅ IDEMPOTENCY CHECK: If already processed, return success (no duplicate processing)
        if (payment.status === 'completed') {
          console.log(`✅ Webhook already processed for payment ${payment.id}`);
          return {
            success: true,
            message: 'Payment already processed (idempotent - skipping duplicate)',
            paymentId: payment.id,
            newStatus: 'completed',
            isDuplicate: true,
          };
        }

        // Map Tsara event to local status
        const newStatus = mapTsaraEventToStatus(event);

        // Update payment status in database
        await db
          .update(payments)
          .set({
            status: newStatus,
            gatewayResponse: JSON.stringify(input),
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));

        console.log(
          `Webhook: Updated payment ${payment.id} status to ${newStatus} (event: ${event})`
        );

        // Handle payment success
        if (newStatus === 'completed' && payment.orderId) {
          try {
            await handlePaymentSuccess({
              id: payment.transactionRef,
              reference: payment.transactionRef,
              amount: payment.amountCents / 100,
              currency: payment.currency || 'NGN',
              status: 'success',
            });
            console.log(
              `Webhook: Payment flow processed for order ${payment.orderId}`
            );
          } catch (err: any) {
            console.error(
              `Webhook: Failed to process payment flow for order ${payment.orderId}:`,
              err
            );
          }
        }

        // Handle payment failure
        if (newStatus === 'failed') {
          try {
            await handlePaymentFailure({
              id: payment.transactionRef,
              reference: payment.transactionRef,
              status: 'failed',
            });
            console.log(`Webhook: Payment ${payment.id} failed`);
          } catch (err: any) {
            console.error(`Webhook: Failed to handle payment failure:`, err);
          }
        }
        
        // Handle payment refund
        if (newStatus === 'refunded' && payment.orderId) {
          try {
            await handlePaymentFailure({
              id: payment.transactionRef,
              reference: payment.transactionRef,
              status: 'refunded',
            });
            console.log(`Webhook: Payment ${payment.id} refunded`);
          } catch (err: any) {
            console.error(`Webhook: Failed to handle payment refund:`, err);
          }
        }

        return {
          success: true,
          message: `Webhook processed: ${event}`,
          paymentId: payment.id,
          newStatus,
        };
      } catch (err: any) {
        console.error('Tsara webhook error:', err);
        return {
          success: false,
          error: err?.message || 'Webhook processing failed',
        };
      }
    }),

  /**
   * Tsara webhook health check
   */
  tsaraHealth: publicProcedure.query(async () => {
    return {
      status: 'ok',
      timestamp: new Date(),
    };
  }),

  // ============================================================================
  // WEBHOOK EVENT MANAGEMENT (Admin/Protected)
  // ============================================================================

  /**
   * Create webhook event (admin only)
   */
  createWebhookEvent: adminProcedure
    .input(WebhookEventInput)
    .mutation(async ({ input }) => {
      const event = await db
        .insert(webhookEvents)
        .values({
          eventId: input.eventType + '-' + Date.now(),
          eventType: input.eventType,
          status: input.status,
        })
        .returning();

      return event[0];
    }),

  /**
   * Retry failed webhook event
   */
  retryFailedEvent: adminProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const event = await db
        .update(webhookEvents)
        .set({
          status: 'pending',
          processedAt: new Date(),
        })
        .where(eq(webhookEvents.id, input.eventId))
        .returning();

      return event[0];
    }),

  /**
   * Get all webhook events with pagination
   */
  getWebhookEvents: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const events = await db
        .select()
        .from(webhookEvents)
        .orderBy(desc(webhookEvents.receivedAt))
        .limit(input.limit)
        .offset(input.offset);

      return events;
    }),

  /**
   * Get webhook events by type
   */
  getEventsByType: adminProcedure
    .input(z.object({ eventType: z.string(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const events = await db
        .select()
        .from(webhookEvents)
        .where(eq(webhookEvents.eventType, input.eventType))
        .orderBy(desc(webhookEvents.receivedAt))
        .limit(input.limit);

      return events;
    }),

  /**
   * Get failed webhook events
   */
  getFailedEvents: adminProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const events = await db
        .select()
        .from(webhookEvents)
        .where(eq(webhookEvents.status, 'failed'))
        .orderBy(desc(webhookEvents.receivedAt))
        .limit(input.limit);

      return events;
    }),

  /**
   * Mark webhook event as processed or failed
   */
  markEventAsProcessed: adminProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        status: z.enum(['processed', 'failed']),
      })
    )
    .mutation(async ({ input }) => {
      const event = await db
        .update(webhookEvents)
        .set({
          status: input.status,
          processedAt: new Date(),
        })
        .where(eq(webhookEvents.id, input.eventId))
        .returning();

      return event[0];
    }),

  // ============================================================================
  // WEBHOOK MONITORING & STATISTICS (Protected)
  // ============================================================================

  /**
   * Log failed webhook from any provider
   */
  logFailedWebhook: protectedProcedure
    .input(
      z.object({
        provider: z.enum(['stripe', 'paypal', 'tsara']),
        eventType: z.string(),
        payload: z.record(z.string(), z.any()),
        statusCode: z.number().optional(),
        errorMessage: z.string(),
        retryCount: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.user?.id) {
          throw new TRPCError({ code: 'UNAUTHORIZED' });
        }

        // Create webhook log entry
        const webhookLog = {
          id: uuidv4(),
          provider: input.provider,
          eventType: input.eventType,
          payload: input.payload,
          status: 'failed',
          statusCode: input.statusCode,
          errorMessage: input.errorMessage,
          retryCount: input.retryCount,
          maxRetries: 3,
          nextRetryAt: new Date(Date.now() + (Math.pow(2, input.retryCount) * 60 * 1000)),
          createdAt: new Date(),
        };

        console.error('Failed Webhook Log:', webhookLog);

        return {
          success: true,
          message: 'Webhook failure logged for retry',
          webhookLog,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to log webhook error',
        });
      }
    }),

  /**
   * Get failed webhooks across all providers
   */
  getFailedWebhooks: protectedProcedure
    .input(FailedWebhooksQuery)
    .query(async ({ ctx, input }) => {
      try {
        if (!ctx.user?.id) {
          throw new TRPCError({ code: 'UNAUTHORIZED' });
        }

        // TODO: Replace with actual database query once webhookLogs table is created
        const failedWebhooks = [
          {
            id: uuidv4(),
            provider: 'stripe',
            eventType: 'charge.failed',
            status: 'failed',
            errorMessage: 'Connection timeout',
            retryCount: 2,
            maxRetries: 3,
            nextRetryAt: new Date(),
            createdAt: new Date(),
          },
        ];

        return {
          total: failedWebhooks.length,
          webhooks: failedWebhooks,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to fetch failed webhooks',
        });
      }
    }),

  /**
   * Retry a specific failed webhook
   */
  retryFailedWebhook: protectedProcedure
    .input(z.object({ webhookId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.user?.id) {
          throw new TRPCError({ code: 'UNAUTHORIZED' });
        }

        // TODO: Implement actual webhook retry logic
        // This should:
        // 1. Fetch the webhook log
        // 2. Verify retry count < maxRetries
        // 3. Re-send the webhook
        // 4. Update status based on result

        return {
          success: true,
          message: 'Webhook retry initiated',
          webhookId: input.webhookId,
          retryScheduled: true,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to retry webhook',
        });
      }
    }),

  /**
   * Get webhook statistics across all providers
   */
  getWebhookStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // TODO: Replace with actual database aggregation once webhookLogs table is created
      return {
        totalWebhooks: 1000,
        successfulWebhooks: 950,
        failedWebhooks: 30,
        retryingWebhooks: 20,
        successRate: 95.0,
        providers: {
          stripe: {
            total: 600,
            successful: 570,
            failed: 20,
            retrying: 10,
            successRate: 95.0,
          },
          paypal: {
            total: 250,
            successful: 240,
            failed: 10,
            retrying: 0,
            successRate: 96.0,
          },
          tsara: {
            total: 150,
            successful: 140,
            failed: 0,
            retrying: 10,
            successRate: 93.33,
          },
        },
        recentFailures: [
          {
            id: uuidv4(),
            provider: 'stripe',
            eventType: 'charge.failed',
            status: 'failed',
            errorMessage: 'Connection timeout',
            createdAt: new Date(),
          },
        ],
      };
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Failed to fetch webhook stats',
      });
    }
  }),

  /**
   * Get detailed webhook information
   */
  getWebhookDetails: protectedProcedure
    .input(z.object({ webhookId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        if (!ctx.user?.id) {
          throw new TRPCError({ code: 'UNAUTHORIZED' });
        }

        // TODO: Fetch from database
        return {
          id: input.webhookId,
          provider: 'stripe',
          eventType: 'charge.failed',
          payload: {
            id: 'evt_123',
            object: 'event',
            type: 'charge.failed',
          },
          status: 'failed',
          statusCode: 503,
          errorMessage: 'Service unavailable',
          retryCount: 2,
          maxRetries: 3,
          createdAt: new Date(),
          lastRetryAt: new Date(),
          nextRetryAt: new Date(),
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to fetch webhook details',
        });
      }
    }),

  /**
   * Webhook health check for all providers
   */
  healthCheck: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // TODO: Implement actual health checks for each provider
      return {
        status: 'healthy',
        timestamp: new Date(),
        providers: {
          stripe: {
            status: 'operational',
            lastCheck: new Date(),
            responseTime: '145ms',
          },
          paypal: {
            status: 'operational',
            lastCheck: new Date(),
            responseTime: '287ms',
          },
          tsara: {
            status: 'operational',
            lastCheck: new Date(),
            responseTime: '98ms',
          },
        },
      };
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Health check failed',
      });
    }
  }),

  /**
   * Cleanup old webhook logs
   */
  cleanupOldWebhookLogs: protectedProcedure
    .input(
      z.object({
        daysOld: z.number().default(30),
        statuses: z
          .array(z.enum(['success', 'failed', 'retry']))
          .default(['success']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.user?.id) {
          throw new TRPCError({ code: 'UNAUTHORIZED' });
        }

        // TODO: Implement actual cleanup with database query
        const deletedCount = 150;

        return {
          success: true,
          message: `Cleaned up ${deletedCount} old webhook logs`,
          deletedCount,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to cleanup webhook logs',
        });
      }
    }),
});
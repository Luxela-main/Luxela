import { db } from '../db';
import { webhookEvents, webhookLogs } from '../db/schema';
import { eq, lt, and, isNull } from 'drizzle-orm';

const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 2000, 5000, 10000, 30000]; // Exponential backoff in ms

/**
 * Check if webhook event has been processed (idempotency)
 * Database-backed deduplication
 */
export async function isWebhookEventProcessed(eventId: string): Promise<boolean> {
  try {
    const [existing] = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.eventId, eventId));

    return existing && existing.status === 'processed';
  } catch (error) {
    console.error('Error checking webhook event status:', error);
    return false;
  }
}

/**
 * Record webhook event for deduplication
 * Ensures idempotency - prevents duplicate processing
 */
export async function recordWebhookEvent(
  eventId: string,
  eventType: string
): Promise<boolean> {
  try {
    // Check if already exists
    const [existing] = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.eventId, eventId));

    if (existing) {
      // Event already recorded
      if (existing.status === 'processed') {
        console.warn('Webhook event already processed:', eventId);
        return false; // Duplicate - don't process again
      }
      return true; // Event exists but not yet processed
    }

    // Record new event
    await db.insert(webhookEvents).values({
      eventId,
      eventType,
      status: 'pending',
      receivedAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error('Error recording webhook event:', error);
    throw error;
  }
}

/**
 * Mark webhook event as successfully processed
 */
export async function markWebhookProcessed(eventId: string): Promise<void> {
  try {
    await db
      .update(webhookEvents)
      .set({
        status: 'processed',
        processedAt: new Date(),
      })
      .where(eq(webhookEvents.eventId, eventId));
  } catch (error) {
    console.error('Error marking webhook as processed:', error);
    throw error;
  }
}

/**
 * Log webhook attempt for provider (Tsara)
 * Tracks retries and errors for debugging
 */
export async function logWebhookAttempt(
  provider: 'tsara' | 'stripe' | 'paypal' | 'flutterwave',
  eventType: string,
  externalEventId: string,
  paymentId?: string,
  orderId?: string,
  status: 'pending' | 'processed' | 'failed' = 'pending',
  errorMessage?: string
): Promise<string> {
  try {
    const [log] = await db
      .insert(webhookLogs)
      .values({
        provider,
        eventType,
        externalEventId,
        paymentId: paymentId || null,
        orderId: orderId || null,
        status,
        errorMessage: errorMessage || null,
        retryCount: 0,
        receivedAt: new Date(),
      })
      .returning();

    return log.id;
  } catch (error) {
    console.error('Error logging webhook attempt:', error);
    throw error;
  }
}

/**
 * Mark webhook log as processed
 */
export async function markWebhookLogProcessed(logId: string): Promise<void> {
  try {
    await db
      .update(webhookLogs)
      .set({
        status: 'processed',
        processedAt: new Date(),
      })
      .where(eq(webhookLogs.id, logId));
  } catch (error) {
    console.error('Error marking webhook log as processed:', error);
    throw error;
  }
}

/**
 * Record webhook processing failure
 */
export async function logFailedWebhook(
  eventId: string,
  error: string,
  logId?: string
): Promise<void> {
  try {
    // Update webhook event
    await db
      .update(webhookEvents)
      .set({
        status: 'failed',
        processedAt: new Date(),
      })
      .where(eq(webhookEvents.eventId, eventId));

    // Update webhook log if provided
    if (logId) {
      const [log] = await db
        .select()
        .from(webhookLogs)
        .where(eq(webhookLogs.id, logId));

      if (log) {
        const nextRetry = log.retryCount < MAX_RETRIES ? 
          new Date(Date.now() + RETRY_DELAYS[Math.min(log.retryCount, RETRY_DELAYS.length - 1)]) :
          null;

        await db
          .update(webhookLogs)
          .set({
            status: log.retryCount >= MAX_RETRIES ? 'failed' : 'pending',
            errorMessage: error,
            retryCount: log.retryCount + 1,
            lastRetryAt: new Date(),
            nextRetryAt: nextRetry,
          })
          .where(eq(webhookLogs.id, logId));
      }
    }

    console.error(`WEBHOOK FAILED: ${eventId} - ${error}`);
  } catch (err) {
    console.error('Failed to log webhook error:', err);
  }
}

export async function getFailedWebhooks(limit: number = 50) {
  return await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.status, 'failed'))
    .limit(limit);
}

export async function getFailedWebhookStats() {
  try {
    const failed = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.status, 'failed'));

    const pending = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.status, 'pending'));

    const processed = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.status, 'processed'));

    return {
      failedCount: failed.length,
      pendingCount: pending.length,
      processedCount: processed.length,
      failureRate:
        failed.length > 0 ? (failed.length / (failed.length + processed.length)) * 100 : 0,
    };
  } catch (error) {
    console.error('Error getting webhook stats:', error);
    return {
      failedCount: 0,
      pendingCount: 0,
      processedCount: 0,
      failureRate: 0,
    };
  }
}

/**
 * Retry failed webhook with exponential backoff
 * Safe retry mechanism
 */
export async function retryFailedWebhook(eventId: string): Promise<boolean> {
  try {
    const [webhook] = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.eventId, eventId));

    if (!webhook) {
      return false;
    }

    if (webhook.status === 'processed') {
      return true; // Already processed
    }

    await db
      .update(webhookEvents)
      .set({
        status: 'pending',
        processedAt: null,
      })
      .where(eq(webhookEvents.eventId, eventId));

    return true;
  } catch (err) {
    console.error('Failed to retry webhook:', err);
    return false;
  }
}

/**
 * Get pending webhooks that need retry
 */
export async function getPendingWebhooksForRetry(): Promise<any[]> {
  try {
    const now = new Date();
    const logs = await db
      .select()
      .from(webhookLogs)
      .where(
        and(
          eq(webhookLogs.status, 'pending'),
          lt(webhookLogs.retryCount, MAX_RETRIES),
          // nextRetryAt is null or in the past
          isNull(webhookLogs.nextRetryAt)
        )
      );

    return logs;
  } catch (error) {
    console.error('Error getting pending webhooks:', error);
    return [];
  }
}

/**
 * Clean up old processed webhooks
 * Prevents database bloat
 */
export async function cleanupOldProcessedWebhooks(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  try {
    // Note: Returns affected rows count if using SQL directly
    // For Drizzle, we need to query first then delete
    const oldEvents = await db
      .select()
      .from(webhookEvents)
      .where(
        and(
          eq(webhookEvents.status, 'processed'),
          lt(webhookEvents.processedAt, cutoffDate)
        )
      );

    if (oldEvents.length > 0) {
      // Delete in batches to avoid locking issues
      for (const event of oldEvents) {
        await db
          .delete(webhookEvents)
          .where(eq(webhookEvents.eventId, event.eventId));
      }
    }

    return oldEvents.length;
  } catch (err) {
    console.error('Failed to cleanup old webhooks:', err);
    return 0;
  }
}

/**
 * Clean up old webhook logs
 */
export async function cleanupOldWebhookLogs(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  try {
    const oldLogs = await db
      .select()
      .from(webhookLogs)
      .where(
        and(
          eq(webhookLogs.status, 'processed'),
          lt(webhookLogs.processedAt, cutoffDate)
        )
      );

    if (oldLogs.length > 0) {
      for (const log of oldLogs) {
        await db
          .delete(webhookLogs)
          .where(eq(webhookLogs.id, log.id));
      }
    }

    return oldLogs.length;
  } catch (error) {
    console.error('Error cleaning up old webhook logs:', error);
    return 0;
  }
}

/**
 * Get webhook processing health metrics
 */
export async function getWebhookHealth() {
  try {
    const stats = await getFailedWebhookStats();
    const pending = await db
      .select()
      .from(webhookLogs)
      .where(eq(webhookLogs.status, 'pending'));

    const recentErrors = await db
      .select()
      .from(webhookLogs)
      .where(eq(webhookLogs.status, 'failed'))
      .limit(10);

    return {
      stats,
      pendingCount: pending.length,
      recentErrors: recentErrors.map((e: typeof recentErrors[0]) => ({
        id: e.id,
        provider: e.provider,
        eventType: e.eventType,
        errorMessage: e.errorMessage,
        retryCount: e.retryCount,
        lastRetryAt: e.lastRetryAt,
      })),
    };
  } catch (error) {
    console.error('Error getting webhook health:', error);
    return null;
  }
}
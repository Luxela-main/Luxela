import { db } from '../db';
import { webhookEvents } from '../db/schema';
import { eq, lt, and } from 'drizzle-orm';

export async function logFailedWebhook(
  eventId: string,
  error: string
): Promise<void> {
  try {
    await db
      .update(webhookEvents)
      .set({
        status: 'failed',
        processedAt: new Date(),
      })
      .where(eq(webhookEvents.eventId, eventId));

    console.error(`WEBHOOK FAILED: ${eventId} - ${error}`);
    
    if (process.env.SENTRY_DSN) {
      console.log(`[Alert] Webhook failed - EventID: ${eventId}`);
    }
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
}

export async function retryFailedWebhook(eventId: string): Promise<boolean> {
  try {
    const webhook = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.eventId, eventId));

    if (!webhook || webhook.length === 0) {
      return false;
    }

    const event = webhook[0];
    if (event.status === 'processed') {
      return true;
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

export async function cleanupOldFailedWebhooks(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  try {
    const result = await db
      .delete(webhookEvents)
      .where(
        and(
          eq(webhookEvents.status, 'failed'),
          lt(webhookEvents.processedAt, cutoffDate)
        )
      );

    return 0;
  } catch (err) {
    console.error('Failed to cleanup old webhooks:', err);
    return 0;
  }
}
import { createTRPCRouter, publicProcedure } from '@/server/trpc/trpc';
import { TRPCError } from '@trpc/server';
import {
  sendAutoReleaseReminders,
  autoReleaseExpiredHolds,
} from '@/server/services/escrowService';

/**
 * Cron router for background jobs
 */
export const cronRouter = createTRPCRouter({
  /**
   * Daily maintenance job:
   * - Sends reminders to buyers about expiring escrow holds (25-30 days)
   * - Auto-releases expired holds (30+ days)
   * 
   */
  dailyMaintenance: publicProcedure.mutation(async () => {
    try {
      console.log('🕐 Starting daily escrow maintenance...');

      // Send reminders to buyers about escrow expiring in 5 days
      const remindersSent = await sendAutoReleaseReminders();
      console.log(`✅ Sent ${remindersSent} auto-release reminders`);

      // Auto-release holds that have been active for 30+ days
      const releasedCount = await autoReleaseExpiredHolds(30);
      console.log(`✅ Auto-released ${releasedCount} expired holds`);

      return {
        success: true,
        message: 'Daily escrow maintenance completed',
        remindersSent,
        releasedCount,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.error('❌ Daily maintenance failed:', err);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to run daily escrow maintenance',
        cause: err,
      });
    }
  }),
});
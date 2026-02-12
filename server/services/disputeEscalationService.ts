import { db } from '@/server/db';
import { disputes } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import logger, { LogCategory } from './logger';
import { sendSupportTicketEmail } from './emailService';

interface EscalationConfig {
  level1: number;
  level2: number;
  level3: number;
  autoResolveAfter: number;
}

const SLA_CONFIG: EscalationConfig = {
  level1: 24,
  level2: 72,
  level3: 168,
  autoResolveAfter: 720,
};

enum EscalationLevel {
  INITIAL = 'initial',
  LEVEL1 = 'level1',
  LEVEL2 = 'level2',
  LEVEL3 = 'level3',
  RESOLVED = 'resolved',
}

/**
 * DISABLED: Disputes table not found in schema
 * This service requires the disputes table to be defined in @/server/db/schema
 */
export class DisputeEscalationService {
  static async processPendingDisputes(): Promise<void> {
    try {
      const now = new Date();
      // TODO: Implement when disputes table is added to schema
      const pendingDisputes: any[] = [];

      // TODO: Implement dispute processing

      logger.logOperation(LogCategory.API, 'Dispute escalation process completed', {
        metadata: { processedCount: pendingDisputes.length },
      });
    } catch (error) {
      logger.logError(LogCategory.API, 'Error processing dispute escalation', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private static async evaluateDispute(dispute: any, now: Date): Promise<void> {
    // NOTE: disputes table not available
    const createdAt = new Date(dispute.createdAt);
    const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    let escalationLevel = EscalationLevel.INITIAL;
    let shouldNotify = false;
    let shouldAutoResolve = false;

    if (hoursElapsed > SLA_CONFIG.autoResolveAfter) {
      escalationLevel = EscalationLevel.RESOLVED;
      shouldAutoResolve = true;
    } else if (hoursElapsed > SLA_CONFIG.level3) {
      escalationLevel = EscalationLevel.LEVEL3;
      shouldNotify = true;
    } else if (hoursElapsed > SLA_CONFIG.level2) {
      escalationLevel = EscalationLevel.LEVEL2;
      shouldNotify = true;
    } else if (hoursElapsed > SLA_CONFIG.level1) {
      escalationLevel = EscalationLevel.LEVEL1;
      shouldNotify = true;
    }

    if (shouldAutoResolve) {
      await this.autoResolveDispute(dispute);
    } else if (shouldNotify) {
      await this.notifyEscalation(dispute, escalationLevel, hoursElapsed);
    }

    await this.updateSLATracking(dispute.id, escalationLevel, hoursElapsed);
  }

  private static async autoResolveDispute(dispute: any): Promise<void> {
    try {
      await db
        .update(disputes)
        .set({
          status: 'closed',
          closedAt: new Date(),
          resolution: 'case_closed',
          resolutionNote: 'Automatically resolved after 30 days (SLA timeout)',
        })
        .where(eq(disputes.id, dispute.id));

      // Send email to buyer
      const { buyers, users: usersTable } = await import('@/server/db/schema').then(m => ({ buyers: m.buyers, users: m.users }));
      try {
        const buyer = await db.select().from(buyers).where(eq(buyers.id, dispute.buyerId));
        if (buyer[0]) {
          const buyerUser = await db.select().from(usersTable).where(eq(usersTable.id, buyer[0].userId));
          if (buyerUser[0]) {
            await sendSupportTicketEmail({
              type: 'ticket_status_update',
              recipientEmail: buyerUser[0].email,
              ticketId: dispute.id,
              ticketSubject: 'Dispute Resolution',
              newStatus: 'closed',
            });
          }
        }
      } catch (emailError) {
        logger.logError(LogCategory.API, 'Failed to send dispute resolution email', emailError instanceof Error ? emailError : new Error(String(emailError)));
      }

      logger.logOperation(LogCategory.API, 'Dispute auto-resolved', {
        entityId: dispute.id,
        metadata: {
          hoursElapsed: (new Date().getTime() - new Date(dispute.created_at).getTime()) / (1000 * 60 * 60),
        },
      });
    } catch (error) {
      logger.logError(LogCategory.API, 'Error auto-resolving dispute', error instanceof Error ? error : new Error(String(error)), {
        entityId: dispute.id,
      });
    }
  }

  private static async notifyEscalation(
    dispute: any,
    level: EscalationLevel,
    hoursElapsed: number
  ): Promise<void> {
    try {
      const escalationMessages: Record<EscalationLevel, { subject: string; message: string }> = {
        [EscalationLevel.INITIAL]: {
          subject: 'New Support Ticket - Requires Review',
          message: 'A new dispute has been raised and requires immediate attention.',
        },
        [EscalationLevel.LEVEL1]: {
          subject: 'Dispute Escalation - Level 1 (24 hours)',
          message: `Your dispute has been open for ${Math.round(hoursElapsed)} hours. Please provide updates or resolution.`,
        },
        [EscalationLevel.LEVEL2]: {
          subject: 'Dispute Escalation - Level 2 (72 hours)',
          message: `Your dispute has been open for ${Math.round(hoursElapsed)} hours. This requires immediate attention from our support team.`,
        },
        [EscalationLevel.LEVEL3]: {
          subject: 'Dispute Escalation - Level 3 (7 days)',
          message: `Your dispute has been escalated to management. Open for ${Math.round(hoursElapsed)} hours. Urgent resolution needed.`,
        },
        [EscalationLevel.RESOLVED]: {
          subject: 'Dispute Resolution',
          message: 'Your dispute has been resolved.',
        },
      };

      const notification = escalationMessages[level];

      // Send email to seller
      if (dispute.sellerId) {
        try {
          const { sellers, users: usersTable } = await import('@/server/db/schema').then(m => ({ sellers: m.sellers, users: m.users }));
          const seller = await db.select().from(sellers).where(eq(sellers.id, dispute.sellerId));
          if (seller[0]) {
            const sellerUser = await db.select().from(usersTable).where(eq(usersTable.id, seller[0].userId));
            if (sellerUser[0]) {
              await sendSupportTicketEmail({
                type: 'ticket_status_update',
                recipientEmail: sellerUser[0].email,
                ticketId: dispute.id,
                ticketSubject: 'Dispute Escalation',
                newStatus: 'escalated',
              });
            }
          }
        } catch (emailError) {
          logger.logError(LogCategory.API, 'Failed to send dispute escalation email', emailError instanceof Error ? emailError : new Error(String(emailError)));
        }
      }

      // NOTE: escalation tracking would require updating dispute status if needed
      // For now, we just notify without updating additional fields

      logger.logOperation(LogCategory.API, 'Dispute escalation notification sent', {
        entityId: dispute.id,
        metadata: { level, hoursElapsed },
      });
    } catch (error) {
      logger.logError(LogCategory.API, 'Error sending escalation notification', error instanceof Error ? error : new Error(String(error)), {
        entityId: dispute.id,
        metadata: { level },
      });
    }
  }

  private static async updateSLATracking(
    disputeId: string,
    level: EscalationLevel,
    hoursElapsed: number
  ): Promise<void> {
    try {
      // NOTE: slaMetrics table structure does not match this usage
      // SLA tracking should use slaTracking table with ticket references
      const isBreached = hoursElapsed > SLA_CONFIG.level1;
    } catch (error) {
      logger.logError(LogCategory.API, 'Error updating SLA tracking', error instanceof Error ? error : new Error(String(error)), {
        entityId: disputeId,
      });
    }
  }

  static async getSLAStatus(disputeId: string) {
    try {
      const dispute = await db
        .select()
        .from(disputes)
        .where(eq(disputes.id, disputeId));

      if (!dispute.length) {
        return null;
      }

      const d = dispute[0];
      const createdAt = new Date(d.createdAt);
      const now = new Date();
      const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      let level = EscalationLevel.INITIAL;
      let remainingHours = SLA_CONFIG.level1;

      if (hoursElapsed > SLA_CONFIG.level3) {
        level = EscalationLevel.LEVEL3;
        remainingHours = Math.max(0, SLA_CONFIG.autoResolveAfter - hoursElapsed);
      } else if (hoursElapsed > SLA_CONFIG.level2) {
        level = EscalationLevel.LEVEL2;
        remainingHours = Math.max(0, SLA_CONFIG.level3 - hoursElapsed);
      } else if (hoursElapsed > SLA_CONFIG.level1) {
        level = EscalationLevel.LEVEL1;
        remainingHours = Math.max(0, SLA_CONFIG.level2 - hoursElapsed);
      } else {
        remainingHours = Math.max(0, SLA_CONFIG.level1 - hoursElapsed);
      }

      return {
        disputeId,
        status: d.status,
        escalationLevel: level,
        hoursElapsed: Math.round(hoursElapsed),
        remainingHours: Math.round(remainingHours),
        createdAt,
        resolvedAt: d.closedAt,
        isAtRisk: hoursElapsed > SLA_CONFIG.level1,
      };
    } catch (error) {
      logger.logError(LogCategory.API, 'Error getting SLA status', error instanceof Error ? error : new Error(String(error)), {
        entityId: disputeId,
      });
      throw error;
    }
  }

  static async getAllSLAMetrics(startDate?: Date, endDate?: Date) {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate || new Date();

      // TODO: Implement when disputes table is added to schema
      const allDisputes: any[] = [];

      const metrics = {
        totalDisputes: allDisputes.length,
        averageResolutionTime: 0,
        breachedSLAs: 0,
        level1Breaches: 0,
        level2Breaches: 0,
        level3Breaches: 0,
        resolutionRate: 0,
      };

      allDisputes.forEach((d) => {
        const createdAt = new Date(d.createdAt);
        const resolvedAt = d.closedAt ? new Date(d.closedAt) : new Date();
        const hoursToResolve = (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

        if (hoursToResolve > SLA_CONFIG.level1) {
          metrics.breachedSLAs++;
        }
        if (hoursToResolve > SLA_CONFIG.level1) metrics.level1Breaches++;
        if (hoursToResolve > SLA_CONFIG.level2) metrics.level2Breaches++;
        if (hoursToResolve > SLA_CONFIG.level3) metrics.level3Breaches++;
      });

      if (allDisputes.length > 0) {
        const totalTime = allDisputes.reduce((sum: any, d: any) => {
          const createdAt = new Date(d.createdAt);
          const resolvedAt = d.closedAt ? new Date(d.closedAt) : new Date();
          return sum + (resolvedAt.getTime() - createdAt.getTime());
        }, 0);

        metrics.averageResolutionTime = (totalTime / allDisputes.length) / (1000 * 60 * 60);
        metrics.resolutionRate = 100;
      }

      return metrics;
    } catch (error) {
      logger.logError(LogCategory.API, 'Error getting SLA metrics', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}
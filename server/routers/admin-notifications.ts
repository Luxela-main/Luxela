import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { db } from '../db';
import {
  adminNotifications,
  supportTickets,
  supportTicketReplies,
  supportTeamMembers,
  slaTracking,
  escalationRules,
  listings,
  orders,
  disputes,
  users,
  sellers,
} from '../db/schema';
import { and, eq, gt, desc, sql, count } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

/**
 * Verify user has admin access from proxy headers
 */
function ensureAdminAccess(admin?: boolean): void {
  if (!admin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required. Only administrators can access this resource.',
    });
  }
}

/**
 * Generate fresh notifications from system data and persist to database
 * Runs non-blocking to avoid slowing down queries
 */
async function generateAndStoreNotifications(adminId: string): Promise<void> {
  const now = new Date();

  try {
    // 1. Check for urgent open tickets
    const urgentTickets = await db
      .select()
      .from(supportTickets)
      .where(and(
        eq(supportTickets.priority, 'urgent'),
        eq(supportTickets.status, 'open')
      ));

    for (const ticket of urgentTickets) {
      const existing = await db
        .select()
        .from(adminNotifications)
        .where(and(
          eq(adminNotifications.adminId, adminId),
          eq(adminNotifications.relatedEntityId, ticket.id),
          sql`${adminNotifications.metadata}->>'ticketId' = ${ticket.id}`
        ))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(adminNotifications).values({
          adminId,
          type: 'urgent_ticket' as any,
          severity: 'critical' as any,
          title: 'Urgent Ticket Requires Immediate Attention',
          message: `Ticket #${ticket.id.slice(0, 8)} - "${ticket.subject}" is marked as urgent and awaiting response`,
          relatedEntityId: ticket.id,
          relatedEntityType: 'ticket',
          actionUrl: `/admin/support/tickets/${ticket.id}`,
          isRead: false,
          metadata: {
            ticketId: ticket.id,
            priority: ticket.priority,
            status: ticket.status,
            subject: ticket.subject,
          },
        });
      }
    }

    // 2. Check for SLA breaches
    const slaTrackingData = await db.select().from(slaTracking);
    const slaBreaches = slaTrackingData.filter(
      (tracking) => tracking.responseBreached || tracking.resolutionBreached
    );

    for (const breach of slaBreaches) {
      if (breach.responseBreached && breach.ticketId) {
        const existing = await db
          .select()
          .from(adminNotifications)
          .where(and(
            eq(adminNotifications.adminId, adminId),
            eq(adminNotifications.relatedEntityId, breach.ticketId),
            sql`${adminNotifications.metadata}->>'breachType' = 'response'`
          ))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(adminNotifications).values({
            adminId,
            type: 'sla_breach' as any,
            severity: 'critical' as any,
            title: 'SLA Response Time Breached',
            message: `Ticket #${breach.ticketId.slice(0, 8)} has exceeded the response time SLA`,
            relatedEntityId: breach.ticketId,
            relatedEntityType: 'ticket',
            actionUrl: `/admin/support/tickets/${breach.ticketId}`,
            isRead: false,
            metadata: {
              breachType: 'response',
              slaMinutes: breach.responseDeadline 
                ? Math.floor((breach.responseDeadline.getTime() - new Date(breach.createdAt).getTime()) / 60000)
                : 0,
              actualMinutes: breach.actualResponseTime,
            },
          });
        }
      }

      if (breach.resolutionBreached && breach.ticketId) {
        const existing = await db
          .select()
          .from(adminNotifications)
          .where(and(
            eq(adminNotifications.adminId, adminId),
            eq(adminNotifications.relatedEntityId, breach.ticketId),
            sql`${adminNotifications.metadata}->>'breachType' = 'resolution'`
          ))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(adminNotifications).values({
            adminId,
            type: 'sla_breach' as any,
            severity: 'warning' as any,
            title: 'SLA Resolution Time Breached',
            message: `Ticket #${breach.ticketId.slice(0, 8)} has exceeded the resolution time SLA`,
            relatedEntityId: breach.ticketId,
            relatedEntityType: 'ticket',
            actionUrl: `/admin/support/tickets/${breach.ticketId}`,
            isRead: false,
            metadata: {
              breachType: 'resolution',
              slaMinutes: breach.resolutionDeadline
                ? Math.floor((breach.resolutionDeadline.getTime() - new Date(breach.createdAt).getTime()) / 60000)
                : 0,
              actualMinutes: breach.actualResolutionTime,
            },
          });
        }
      }
    }

    // 3. Check for team member capacity alerts
    const teamMembers = await db.select().from(supportTeamMembers);
    for (const member of teamMembers) {
      const utilizationPercent = (member.currentLoadCount / member.maxCapacity) * 100;

      if (utilizationPercent > 90) {
        const existing = await db
          .select()
          .from(adminNotifications)
          .where(and(
            eq(adminNotifications.adminId, adminId),
            eq(adminNotifications.relatedEntityId, member.id),
            sql`${adminNotifications.metadata}->>'level' = 'critical'`
          ))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(adminNotifications).values({
            adminId,
            type: 'team_capacity' as any,
            severity: 'critical' as any,
            title: 'Team Member at Critical Capacity',
            message: `${member.name} has reached ${Math.round(utilizationPercent)}% capacity (${member.currentLoadCount}/${member.maxCapacity} tickets)`,
            relatedEntityId: member.id,
            relatedEntityType: 'team_member',
            actionUrl: '/admin/support/team',
            isRead: false,
            metadata: {
              memberId: member.id,
              memberName: member.name,
              currentLoad: member.currentLoadCount,
              maxCapacity: member.maxCapacity,
              utilizationPercent,
              level: 'critical',
            },
          });
        }
      } else if (utilizationPercent > 75) {
        const existing = await db
          .select()
          .from(adminNotifications)
          .where(and(
            eq(adminNotifications.adminId, adminId),
            eq(adminNotifications.relatedEntityId, member.id),
            sql`${adminNotifications.metadata}->>'level' = 'warning'`
          ))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(adminNotifications).values({
            adminId,
            type: 'team_capacity' as any,
            severity: 'warning' as any,
            title: 'Team Member Approaching Full Capacity',
            message: `${member.name} is at ${Math.round(utilizationPercent)}% capacity`,
            relatedEntityId: member.id,
            relatedEntityType: 'team_member',
            actionUrl: '/admin/support/team',
            isRead: false,
            metadata: {
              memberId: member.id,
              memberName: member.name,
              utilizationPercent,
              level: 'warning',
            },
          });
        }
      }
    }

    // 4. Check for escalated tickets waiting too long
    const escalatedTickets = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.priority, 'high'));

    for (const ticket of escalatedTickets) {
      const ticketAge = now.getTime() - new Date(ticket.createdAt).getTime();
      const hoursOld = ticketAge / (1000 * 60 * 60);

      if (hoursOld > 8 && (ticket.status === 'open' || ticket.status === 'in_progress')) {
        const existing = await db
          .select()
          .from(adminNotifications)
          .where(and(
            eq(adminNotifications.adminId, adminId),
            eq(adminNotifications.relatedEntityId, ticket.id),
            sql`${adminNotifications.type} = 'escalation'`
          ))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(adminNotifications).values({
            adminId,
            type: 'escalation' as any,
            severity: 'warning' as any,
            title: 'High-Priority Ticket Pending for Extended Period',
            message: `Ticket #${ticket.id.slice(0, 8)} has been pending for ${Math.round(hoursOld)} hours`,
            relatedEntityId: ticket.id,
            relatedEntityType: 'ticket',
            actionUrl: `/admin/support/tickets/${ticket.id}`,
            isRead: false,
            metadata: {
              ticketId: ticket.id,
              hoursOld: Math.round(hoursOld),
              status: ticket.status,
            },
          });
        }
      }
    }

    // 5. Check for unresponded tickets
    const allTickets = await db.select().from(supportTickets);
    for (const ticket of allTickets) {
      if (ticket.status === 'open') {
        const replies = await db
          .select()
          .from(supportTicketReplies)
          .where(eq(supportTicketReplies.ticketId, ticket.id));

        const adminReplies = replies.filter((r) => r.senderRole === 'admin');
        if (adminReplies.length === 0) {
          const ticketAge = now.getTime() - new Date(ticket.createdAt).getTime();
          const minutesOld = ticketAge / (1000 * 60);

          if (minutesOld > 30) {
            const existing = await db
              .select()
              .from(adminNotifications)
              .where(and(
                eq(adminNotifications.adminId, adminId),
                eq(adminNotifications.relatedEntityId, ticket.id),
                sql`${adminNotifications.type} = 'new_reply'`
              ))
              .limit(1);

            if (existing.length === 0) {
              await db.insert(adminNotifications).values({
                adminId,
                type: 'new_reply' as any,
                severity: 'info' as any,
                title: 'Ticket Awaiting First Response',
                message: `Ticket #${ticket.id.slice(0, 8)} - "${ticket.subject}" has no admin response yet (${Math.round(minutesOld)} minutes)`,
                relatedEntityId: ticket.id,
                relatedEntityType: 'ticket',
                actionUrl: `/admin/support/tickets/${ticket.id}`,
                isRead: false,
                metadata: {
                  ticketId: ticket.id,
                  minutesOld: Math.round(minutesOld),
                },
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error generating admin notifications:', error);
  }
}

export const adminNotificationsRouter = createTRPCRouter({
  /**
   * Get all notifications for admin with real-time support via polling
   */
  getNotifications: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/admin/notifications',
        tags: ['Admin Notifications'],
        summary: 'Get real-time notifications for admin dashboard',
      },
    })
    .input(
      z.object({
        category: z.string().optional(),
        severity: z.enum(['info', 'warning', 'critical']).optional(),
        unreadOnly: z.boolean().default(false),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      }

      // Verify admin access from proxy headers
      ensureAdminAccess(ctx.user?.admin);

      // Generate fresh notifications (non-blocking background task)
      generateAndStoreNotifications(userId).catch(err => 
        console.error('Error generating notifications:', err)
      );

      // Build query conditions
      const conditions = [eq(adminNotifications.adminId, userId)];
      
      if (input.category) {
        conditions.push(eq(adminNotifications.type, input.category as any));
      }
      
      if (input.severity) {
        conditions.push(eq(adminNotifications.severity, input.severity as any));
      }
      
      if (input.unreadOnly) {
        conditions.push(eq(adminNotifications.isRead, false));
      }

      // Get total count
      const totalResult = await db
        .select({ totalCount: count() })
        .from(adminNotifications)
        .where(and(...conditions));

      const total = totalResult[0]?.totalCount ?? 0;

      // Get unread count
      const unreadResult = await db
        .select({ unreadCount: count() })
        .from(adminNotifications)
        .where(and(eq(adminNotifications.adminId, userId), eq(adminNotifications.isRead, false)));

      const unreadCount = unreadResult[0]?.unreadCount ?? 0;

      // Get paginated notifications
      const notifs = await db
        .select()
        .from(adminNotifications)
        .where(and(...conditions))
        .orderBy(desc(adminNotifications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return {
        notifications: notifs.map(n => ({
          id: n.id,
          category: n.type,
          severity: n.severity,
          title: n.title,
          message: n.message,
          relatedEntityId: n.relatedEntityId,
          relatedEntityType: n.relatedEntityType,
          actionUrl: n.actionUrl,
          isRead: n.isRead,
          isStarred: n.isStarred,
          createdAt: n.createdAt.toISOString(),
          metadata: n.metadata,
        })),
        total,
        unreadCount,
      };
    }),

  /**
   * Get notifications grouped by category
   */
  getNotificationsByCategory: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/admin/notifications/categories',
        tags: ['Admin Notifications'],
        summary: 'Get notifications grouped by category',
      },
    })
    .output(
      z.object({
        categories: z.record(
          z.string(),
          z.array(
            z.object({
              id: z.string(),
              category: z.string(),
              severity: z.string(),
              title: z.string(),
              message: z.string(),
              createdAt: z.string(),
            })
          )
        ),
        totalCount: z.number(),
      })
    )
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      }

      // Verify admin access from proxy headers
      ensureAdminAccess(ctx.user?.admin);

      // Generate fresh notifications
      await generateAndStoreNotifications(userId).catch(err =>
        console.error('Error generating notifications:', err)
      );

      const notifs = await db
        .select()
        .from(adminNotifications)
        .where(eq(adminNotifications.adminId, userId))
        .orderBy(desc(adminNotifications.createdAt));

      const grouped: Record<string, any[]> = {};

      notifs.forEach((notif) => {
        if (!grouped[notif.type]) {
          grouped[notif.type] = [];
        }
        grouped[notif.type].push({
          id: notif.id,
          category: notif.type,
          severity: notif.severity,
          title: notif.title,
          message: notif.message,
          createdAt: notif.createdAt.toISOString(),
        });
      });

      return {
        categories: grouped,
        totalCount: notifs.length,
      };
    }),

  /**
   * Get unread notification count for badge
   */
  getUnreadCount: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/admin/notifications/unread-count',
        tags: ['Admin Notifications'],
        summary: 'Get count of unread notifications',
      },
    })
    .output(z.object({ count: z.number() }))
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      }

      // Verify admin access from proxy headers
      ensureAdminAccess(ctx.user?.admin);

      const result = await db
        .select({ unreadCount: count() })
        .from(adminNotifications)
        .where(and(
          eq(adminNotifications.adminId, userId),
          eq(adminNotifications.isRead, false)
        ));

      const unreadCount = result[0]?.unreadCount ?? 0;
      return { count: unreadCount };
    }),

  /**
   * Mark notification as read with ownership validation
   */
  markAsRead: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/admin/notifications/{notificationId}/read',
        tags: ['Admin Notifications'],
        summary: 'Mark notification as read',
      },
    })
    .input(z.object({ notificationId: z.string() }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      }

      // Verify admin access from proxy headers
      ensureAdminAccess(ctx.user?.admin);

      // Verify ownership before updating
      const notif = await db
        .select()
        .from(adminNotifications)
        .where(eq(adminNotifications.id, input.notificationId))
        .limit(1);

      if (notif.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      if (notif[0].adminId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot modify other admin\'s notifications',
        });
      }

      // Update notification
      await db
        .update(adminNotifications)
        .set({ isRead: true, updatedAt: new Date() })
        .where(eq(adminNotifications.id, input.notificationId));

      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/admin/notifications/read-all',
        tags: ['Admin Notifications'],
        summary: 'Mark all notifications as read',
      },
    })
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      }

      // Verify admin access from proxy headers
      ensureAdminAccess(ctx.user?.admin);

      await db
        .update(adminNotifications)
        .set({ isRead: true, updatedAt: new Date() })
        .where(eq(adminNotifications.adminId, userId));

      return { success: true };
    }),

  /**
   * Get notification details
   */
  getNotificationDetail: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/admin/notifications/{notificationId}',
        tags: ['Admin Notifications'],
        summary: 'Get detailed notification information',
      },
    })
    .input(z.object({ notificationId: z.string() }))
    .output(
      z.object({
        id: z.string(),
        category: z.string(),
        severity: z.string(),
        title: z.string(),
        message: z.string(),
        relatedEntityId: z.string().nullable(),
        relatedEntityType: z.string().nullable(),
        actionUrl: z.string().nullable(),
        isRead: z.boolean(),
        isStarred: z.boolean(),
        createdAt: z.string(),
        metadata: z.any().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      }

      // Verify admin access from proxy headers
      ensureAdminAccess(ctx.user?.admin);

      const notif = await db
        .select()
        .from(adminNotifications)
        .where(and(
          eq(adminNotifications.id, input.notificationId),
          eq(adminNotifications.adminId, userId)
        ))
        .limit(1);

      if (notif.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      const n = notif[0];
      return {
        id: n.id,
        category: n.type,
        severity: n.severity,
        title: n.title,
        message: n.message,
        relatedEntityId: n.relatedEntityId,
        relatedEntityType: n.relatedEntityType,
        actionUrl: n.actionUrl,
        isRead: n.isRead,
        isStarred: n.isStarred,
        createdAt: n.createdAt.toISOString(),
        metadata: n.metadata,
      };
    }),

  /**
   * Star/unstar a notification
   */
  toggleStar: protectedProcedure
    .input(z.object({ 
      notificationId: z.string(),
      starred: z.boolean(),
    }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      }

      // Verify admin access from proxy headers
      ensureAdminAccess(ctx.user?.admin);

      // Verify ownership
      const notif = await db
        .select()
        .from(adminNotifications)
        .where(eq(adminNotifications.id, input.notificationId))
        .limit(1);

      if (notif.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      if (notif[0].adminId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot modify other admin\'s notifications',
        });
      }

      await db
        .update(adminNotifications)
        .set({ isStarred: input.starred, updatedAt: new Date() })
        .where(eq(adminNotifications.id, input.notificationId));

      return { success: true };
    }),

  /**
   * Delete a notification
   */
  deleteNotification: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      }

      // Verify admin access from proxy headers
      ensureAdminAccess(ctx.user?.admin);

      // Verify ownership
      const notif = await db
        .select()
        .from(adminNotifications)
        .where(eq(adminNotifications.id, input.notificationId))
        .limit(1);

      if (notif.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      if (notif[0].adminId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot delete other admin\'s notifications',
        });
      }

      await db
        .delete(adminNotifications)
        .where(eq(adminNotifications.id, input.notificationId));

      return { success: true };
    }),
});
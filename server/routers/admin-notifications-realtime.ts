import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { db } from '../db';
import { adminNotifications, users } from '../db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const adminNotificationsRealtimeRouter = createTRPCRouter({
  /**
   * Get all notifications for admin with real-time updates
   */
  getNotifications: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/admin/notifications',
        tags: ['Admin Notifications'],
        summary: 'Get all notifications for admin',
      },
    })
    .input(
      z.object({
        severity: z.enum(['info', 'warning', 'critical']).optional(),
        unreadOnly: z.boolean().default(false),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .output(
      z.object({
        notifications: z.array(
          z.object({
            id: z.string(),
            type: z.string(),
            title: z.string(),
            message: z.string(),
            severity: z.string(),
            isRead: z.boolean(),
            isStarred: z.boolean(),
            relatedEntityId: z.string().nullable(),
            relatedEntityType: z.string().nullable(),
            actionUrl: z.string().nullable(),
            createdAt: z.date(),
            metadata: z.any().optional(),
          })
        ),
        total: z.number(),
        unreadCount: z.number(),
        criticalCount: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      }

      // Check if admin
      const admin = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!admin[0] || admin[0].role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not an admin',
        });
      }

      const conditions = [eq(adminNotifications.adminId, userId)];

      if (input.unreadOnly) {
        conditions.push(eq(adminNotifications.isRead, false));
      }

      if (input.severity) {
        conditions.push(eq(adminNotifications.severity, input.severity));
      }

      const query = db
        .select()
        .from(adminNotifications)
        .where(and(...conditions))

      const notifications = await query.orderBy(
        desc(adminNotifications.createdAt)
      );

      const total = notifications.length;
      const unreadCount = notifications.filter((n: any) => !n.isRead).length;
      const criticalCount = notifications.filter((n: any) => n.severity === 'critical')
        .length;

      const paginated = notifications.slice(input.offset, input.offset + input.limit);

      return {
        notifications: paginated.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          severity: n.severity,
          isRead: n.isRead,
          isStarred: n.isStarred,
          relatedEntityId: n.relatedEntityId,
          relatedEntityType: n.relatedEntityType,
          actionUrl: n.actionUrl,
          createdAt: n.createdAt,
          metadata: n.metadata,
        })),
        total,
        unreadCount,
        criticalCount,
      };
    }),

  /**
   * Get unread notification count for badge (real-time)
   */
  getUnreadCount: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/admin/notifications/unread-count',
        tags: ['Admin Notifications'],
        summary: 'Get unread notification count',
      },
    })
    .output(z.object({ count: z.number(), criticalCount: z.number() }))
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      }

      // Check if admin
      const admin = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!admin[0] || admin[0].role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not an admin',
        });
      }

      const unreadResult = await db
        .select()
        .from(adminNotifications)
        .where(
          and(
            eq(adminNotifications.adminId, userId),
            eq(adminNotifications.isRead, false)
          )
        );

      const criticalResult = await db
        .select()
        .from(adminNotifications)
        .where(
          and(
            eq(adminNotifications.adminId, userId),
            eq(adminNotifications.severity, 'critical'),
            eq(adminNotifications.isRead, false)
          )
        );

      return { 
        count: unreadResult.length,
        criticalCount: criticalResult.length,
      };
    }),

  /**
   * Mark notification as read
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

      // Check if admin
      const admin = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!admin[0] || admin[0].role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not an admin',
        });
      }

      // Verify ownership
      const notification = await db
        .select()
        .from(adminNotifications)
        .where(
          and(
            eq(adminNotifications.id, input.notificationId),
            eq(adminNotifications.adminId, userId)
          )
        );

      if (!notification[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

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

      // Check if admin
      const admin = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!admin[0] || admin[0].role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not an admin',
        });
      }

      await db
        .update(adminNotifications)
        .set({ isRead: true, updatedAt: new Date() })
        .where(eq(adminNotifications.adminId, userId));

      return { success: true };
    }),

  /**
   * Toggle star on notification
   */
  toggleStar: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/admin/notifications/{notificationId}/star',
        tags: ['Admin Notifications'],
        summary: 'Toggle star on notification',
      },
    })
    .input(z.object({ notificationId: z.string() }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      }

      // Check if admin
      const admin = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!admin[0] || admin[0].role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not an admin',
        });
      }

      const notification = await db
        .select()
        .from(adminNotifications)
        .where(
          and(
            eq(adminNotifications.id, input.notificationId),
            eq(adminNotifications.adminId, userId)
          )
        );

      if (!notification[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      await db
        .update(adminNotifications)
        .set({ isStarred: !notification[0].isStarred, updatedAt: new Date() })
        .where(eq(adminNotifications.id, input.notificationId));

      return { success: true };
    }),

  /**
   * Delete notification
   */
  deleteNotification: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/admin/notifications/{notificationId}',
        tags: ['Admin Notifications'],
        summary: 'Delete a notification',
      },
    })
    .input(z.object({ notificationId: z.string() }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      }

      // Check if admin
      const admin = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!admin[0] || admin[0].role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not an admin',
        });
      }

      // Verify ownership
      const notification = await db
        .select()
        .from(adminNotifications)
        .where(
          and(
            eq(adminNotifications.id, input.notificationId),
            eq(adminNotifications.adminId, userId)
          )
        );

      if (!notification[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      await db
        .delete(adminNotifications)
        .where(eq(adminNotifications.id, input.notificationId));

      return { success: true };
    }),
});
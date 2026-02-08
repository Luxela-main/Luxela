import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { db } from '../db';
import {
  buyerNotifications,
  buyers,
  orders,
  listings,
  reviews,
  disputes,
} from '../db/schema';
import { and, eq, gt, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

/**
 * Generate fresh buyer notifications from system data and persist to database
 * Runs non-blocking to avoid slowing down queries
 */
async function generateAndStoreBuyerNotifications(
  buyerId: string
): Promise<void> {
  const now = new Date();

  try {
    // 1. Check for order updates
    const buyerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.buyerId, buyerId))
      .limit(100);

    for (const order of buyerOrders) {
      let notifType: string = 'order_update';
      let title: string = 'Order Updated';
      let message: string = '';
      let severity: string = 'info';

      if (order.orderStatus === 'confirmed') {
        notifType = 'order_confirmed';
        title = 'Order Confirmed';
        message = `Your order #${order.id.slice(0, 8)} has been confirmed. Total: ${
          order.currency
        } ${(order.amountCents ?? 0) / 100}`;
      } else if (order.orderStatus === 'shipped') {
        notifType = 'shipment_ready';
        title = 'Order Shipped';
        message = `Your order #${order.id.slice(0, 8)} has been shipped! Tracking: ${
          order.trackingNumber || 'Pending'
        }`;
      } else if (order.orderStatus === 'delivered') {
        notifType = 'in_transit';
        title = 'Order Delivered';
        message = `Your order #${order.id.slice(0, 8)} has been delivered!`;
      } else if (order.orderStatus === 'canceled') {
        notifType = 'order_canceled';
        title = 'Order Canceled';
        message = `Your order #${order.id.slice(0, 8)} has been canceled`;
        severity = 'warning';
      }

      const existing = await db
        .select()
        .from(buyerNotifications)
        .where(and(
          eq(buyerNotifications.buyerId, buyerId),
          eq(buyerNotifications.relatedEntityId, order.id),
          sql`${buyerNotifications.metadata}->>'notificationType' = ${notifType}`
        ))
        .limit(1);

      if (existing.length === 0 && message) {
        await db.insert(buyerNotifications).values({
          buyerId,
          type: notifType as any,
          title,
          message,
          relatedEntityId: order.id,
          relatedEntityType: 'order',
          actionUrl: `/buyer/orders/${order.id}`,
          isRead: false,
          metadata: {
            notificationType: notifType,
            orderId: order.id,
            orderStatus: order.orderStatus,
            amount: (order.amountCents ?? 0) / 100,
            currency: order.currency,
            severity,
          },
        });
      }
    }

    // 2. Check for reviews on purchased items - SKIPPED: Not enough data from schema
    // Would need to implement once buyer/listing relations are clearer

    // 3. Check for price drops on favorited listings - SKIPPED: Schema doesn't have salePrice/originalPrice
    // Would implement once pricing fields are added to listings schema

    // 4. Check for new disputes
    const buyerDisputes = await db
      .select()
      .from(disputes)
      .where(eq(disputes.buyerId, buyerId))
      .limit(50);

    for (const dispute of buyerDisputes) {
      const existing = await db
        .select()
        .from(buyerNotifications)
        .where(and(
          eq(buyerNotifications.buyerId, buyerId),
          eq(buyerNotifications.relatedEntityId, dispute.id),
          sql`${buyerNotifications.metadata}->>'notificationType' = 'dispute_${dispute.status}'`
        ))
        .limit(1);

      if (existing.length === 0) {
        let title: string = 'Dispute Update';
        let message: string = '';
        let severity: string = 'warning';

        if (dispute.status === 'open') {
          title = 'Dispute Opened';
          message = `Your dispute for order #${dispute.orderId?.slice(
            0,
            8
          )} has been opened`;
        } else if (dispute.status === 'resolved') {
          title = 'Dispute Resolved';
          message = `Your dispute has been resolved in your favor`;
          severity = 'info';
        } else if (dispute.status === 'closed') {
          title = 'Dispute Closed';
          message = `Your dispute case has been closed`;
          severity = 'info';
        }

        if (message) {
          await db.insert(buyerNotifications).values({
            buyerId,
            type: 'dispute_alert' as any,
            title,
            message,
            relatedEntityId: dispute.id,
            relatedEntityType: 'dispute',
            actionUrl: `/buyer/disputes/${dispute.id}`,
            isRead: false,
            metadata: {
              notificationType: `dispute_${dispute.status}`,
              disputeId: dispute.id,
              status: dispute.status,
              subject: dispute.subject,
            },
          });
        }
      }
    }

    // 5. Back in stock notifications - SKIPPED: Schema doesn't have quantity/isActive fields
    // Would implement once inventory fields are added to listings schema
  } catch (error) {
    console.error('Error generating buyer notifications:', error);
  }
}

export const buyerNotificationsRouter = createTRPCRouter({
  /**
   * Get all notifications for buyer with real-time support via polling
   * UNIFIED endpoint replacing buyer-notifications.ts, buyer-notifications-queries.ts, buyer-notifications-persistent.ts
   */
  getNotifications: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/buyer/notifications',
        tags: ['Buyer Notifications'],
        summary: 'Get real-time notifications for buyer dashboard (unified)',
      },
    })
    .input(
      z.object({
        type: z.string().optional(),
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

      const buyer = await db.query.buyers.findFirst({
        where: eq(buyers.userId, userId),
      });

      if (!buyer) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a buyer',
        });
      }

      // Generate fresh notifications (non-blocking background task)
      generateAndStoreBuyerNotifications(buyer.id).catch((err) =>
        console.error('Error generating notifications:', err)
      );

      // Build query conditions
      const conditions = [eq(buyerNotifications.buyerId, buyer.id)];

      if (input.type) {
        conditions.push(eq(buyerNotifications.type, input.type as any));
      }

      if (input.unreadOnly) {
        conditions.push(eq(buyerNotifications.isRead, false));
      }

      // Get total count
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(buyerNotifications)
        .where(and(...conditions));

      const total = totalResult[0]?.count ?? 0;

      // Get unread count
      const unreadResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(buyerNotifications)
        .where(and(
          eq(buyerNotifications.buyerId, buyer.id),
          eq(buyerNotifications.isRead, false)
        ));

      const unreadCount = unreadResult[0]?.count ?? 0;

      // Get paginated notifications
      const notifs = await db
        .select()
        .from(buyerNotifications)
        .where(and(...conditions))
        .orderBy(desc(buyerNotifications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return {
        notifications: notifs.map((n) => ({
          id: n.id,
          type: n.type,
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
   * Get ONLY unread count for badge (optimized for frequent polling)
   */
  getUnreadCount: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/buyer/notifications/unread-count',
        tags: ['Buyer Notifications'],
        summary: 'Get count of unread notifications (optimized badge query)',
      },
    })
    .output(z.object({ count: z.number() }))
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      }

      const buyer = await db.query.buyers.findFirst({
        where: eq(buyers.userId, userId),
      });

      if (!buyer) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a buyer',
        });
      }

      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(buyerNotifications)
        .where(and(
          eq(buyerNotifications.buyerId, buyer.id),
          eq(buyerNotifications.isRead, false)
        ));

      const count = result[0]?.count ?? 0;
      return { count };
    }),

  /**
   * Get notifications by type
   */
  getNotificationsByType: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/buyer/notifications/by-type',
        tags: ['Buyer Notifications'],
        summary: 'Get notifications grouped by type',
      },
    })
    .output(
      z.object({
        types: z.record(
          z.string(),
          z.array(
            z.object({
              id: z.string(),
              type: z.string(),
              title: z.string(),
              message: z.string(),
              createdAt: z.string(),
            })
          )
        ),
      })
    )
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      }

      const buyer = await db.query.buyers.findFirst({
        where: eq(buyers.userId, userId),
      });

      if (!buyer) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a buyer',
        });
      }

      // Generate fresh notifications
      await generateAndStoreBuyerNotifications(buyer.id).catch((err) =>
        console.error('Error generating notifications:', err)
      );

      const notifs = await db
        .select()
        .from(buyerNotifications)
        .where(eq(buyerNotifications.buyerId, buyer.id))
        .orderBy(desc(buyerNotifications.createdAt));

      const grouped: Record<string, any[]> = {};

      notifs.forEach((notif) => {
        if (!grouped[notif.type]) {
          grouped[notif.type] = [];
        }
        grouped[notif.type].push({
          id: notif.id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          createdAt: notif.createdAt.toISOString(),
        });
      });

      return { types: grouped };
    }),

  /**
   * Mark notification as read with ownership validation
   */
  markAsRead: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/buyer/notifications/{notificationId}/read',
        tags: ['Buyer Notifications'],
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

      const buyer = await db.query.buyers.findFirst({
        where: eq(buyers.userId, userId),
      });

      if (!buyer) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a buyer',
        });
      }

      // Verify ownership before updating
      const notif = await db
        .select()
        .from(buyerNotifications)
        .where(eq(buyerNotifications.id, input.notificationId))
        .limit(1);

      if (notif.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      if (notif[0].buyerId !== buyer.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot modify other buyer\'s notifications',
        });
      }

      // Update notification
      await db
        .update(buyerNotifications)
        .set({ isRead: true, updatedAt: new Date() })
        .where(eq(buyerNotifications.id, input.notificationId));

      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/buyer/notifications/read-all',
        tags: ['Buyer Notifications'],
        summary: 'Mark all notifications as read',
      },
    })
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      }

      const buyer = await db.query.buyers.findFirst({
        where: eq(buyers.userId, userId),
      });

      if (!buyer) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a buyer',
        });
      }

      await db
        .update(buyerNotifications)
        .set({ isRead: true, updatedAt: new Date() })
        .where(eq(buyerNotifications.buyerId, buyer.id));

      return { success: true };
    }),

  /**
   * Star/unstar a notification
   */
  toggleStar: protectedProcedure
    .input(
      z.object({
        notificationId: z.string(),
        starred: z.boolean(),
      })
    )
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      }

      const buyer = await db.query.buyers.findFirst({
        where: eq(buyers.userId, userId),
      });

      if (!buyer) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a buyer',
        });
      }

      // Verify ownership
      const notif = await db
        .select()
        .from(buyerNotifications)
        .where(eq(buyerNotifications.id, input.notificationId))
        .limit(1);

      if (notif.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      if (notif[0].buyerId !== buyer.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot modify other buyer\'s notifications',
        });
      }

      await db
        .update(buyerNotifications)
        .set({ isStarred: input.starred, updatedAt: new Date() })
        .where(eq(buyerNotifications.id, input.notificationId));

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

      const buyer = await db.query.buyers.findFirst({
        where: eq(buyers.userId, userId),
      });

      if (!buyer) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a buyer',
        });
      }

      // Verify ownership
      const notif = await db
        .select()
        .from(buyerNotifications)
        .where(eq(buyerNotifications.id, input.notificationId))
        .limit(1);

      if (notif.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      if (notif[0].buyerId !== buyer.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot delete other buyer\'s notifications',
        });
      }

      await db
        .delete(buyerNotifications)
        .where(eq(buyerNotifications.id, input.notificationId));

      return { success: true };
    }),
});
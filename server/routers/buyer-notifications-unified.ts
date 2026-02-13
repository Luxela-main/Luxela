import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { db } from '../db';
import {
  buyerNotifications,
  buyers,
  orders,
  listings,
  reviews,
  disputes,
  buyerFavorites,
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
    // Check for order updates
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
        try {
          await db.insert(buyerNotifications).values({
            buyerId,
            type: notifType as any,
            title,
            message,
            relatedEntityId: order.id,
            relatedEntityType: 'order',
          actionUrl: `/buyer/orders/${order.id}`,
          isRead: false,
          isStarred: false,
          metadata: {
            notificationType: notifType,
            orderId: order.id,
            orderStatus: order.orderStatus,
            amount: (order.amountCents ?? 0) / 100,
            currency: order.currency,
            severity,
          },
          });
        } catch (notifError: any) {
          console.error(`Failed to create order notification for buyer ${buyerId}:`, {
            message: notifError.message,
            code: notifError.code,
            detail: notifError.detail,
            orderId: order.id,
            type: notifType,
          });
          if (notifError.message?.includes('invalid input value for enum')) {
            console.error('ENUM ERROR: notification_category enum value might not be in database yet');
          }
        }
      }
    }

    // Check for reviews posted by this buyer
    const buyerReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.buyerId, buyerId))
      .limit(100);

    for (const review of buyerReviews) {
      const existing = await db
        .select()
        .from(buyerNotifications)
        .where(and(
          eq(buyerNotifications.buyerId, buyerId),
          eq(buyerNotifications.relatedEntityId, review.id),
          sql`${buyerNotifications.metadata}->>'notificationType' = 'review_posted'`
        ))
        .limit(1);

      if (existing.length === 0) {
        // Get listing title for context
        const listing = await db
          .select({ title: listings.title })
          .from(listings)
          .where(eq(listings.id, review.listingId))
          .limit(1);

        const listingTitle = listing[0]?.title || 'Item';

        try {
          await db.insert(buyerNotifications).values({
            buyerId,
            type: 'new_review' as any,
            title: 'Review Posted',
            message: `Your ${review.rating}-star review on "${listingTitle}" has been posted successfully!`,
            relatedEntityId: review.id,
            relatedEntityType: 'review',
            actionUrl: `/buyer/listings/${review.listingId}`,
            isRead: false,
            isStarred: false,
            metadata: {
              notificationType: 'review_posted',
              reviewId: review.id,
              listingId: review.listingId,
              rating: review.rating,
              preview: review.comment ? review.comment.substring(0, 100) : '',
            },
          });
        } catch (notifError: any) {
          console.error(`Failed to create review notification for buyer ${buyerId}:`, {
            message: notifError.message,
            code: notifError.code,
            detail: notifError.detail,
            buyerId: buyerId,
            reviewId: review.id,
            type: 'new_review',
          });
          // Log enum error details for debugging
          if (notifError.message?.includes('invalid input value for enum')) {
            console.error('ENUM ERROR: notification_category enum value might not be in database yet');
            console.error('Please run: npx ts-node migrations/add-all-missing-notification-categories.ts');
          }
          // Don't throw - continue processing other notifications
        }
      }
    }

    // Check for price drops on favorited listings
    const buyerFavoritesList = await db
      .select()
      .from(buyerFavorites)
      .where(eq(buyerFavorites.buyerId, buyerId))
      .limit(100);

    for (const favorite of buyerFavoritesList) {
      const listing = await db
        .select({
          title: listings.title,
          priceCents: listings.priceCents,
        })
        .from(listings)
        .where(eq(listings.id, favorite.listingId))
        .limit(1);

      if (listing[0]) {
        const currentPrice = (listing[0].priceCents ?? 0) / 100;
        const listingTitle = listing[0].title || 'Item';

        // Check if we already have a price drop notification for this favorite
        const existing = await db
          .select()
          .from(buyerNotifications)
          .where(and(
            eq(buyerNotifications.buyerId, buyerId),
            eq(buyerNotifications.relatedEntityId, favorite.listingId),
            sql`${buyerNotifications.metadata}->>'notificationType' = 'price_drop'`
          ))
          .limit(1);

        if (existing.length === 0 && currentPrice > 0) {
          try {
            await db.insert(buyerNotifications).values({
            buyerId,
            type: 'price_drop' as any,
            title: 'Price Alert!',
            message: `"${listingTitle}" is now available at NGN ${currentPrice.toLocaleString()}!`,
            relatedEntityId: favorite.listingId,
            relatedEntityType: 'listing',
            actionUrl: `/buyer/listings/${favorite.listingId}`,
            isRead: false,
            isStarred: false,
            metadata: {
              notificationType: 'price_drop',
              listingId: favorite.listingId,
              currentPrice,
              listingTitle,
            },
          });
          } catch (notifError: any) {
            console.error(`Failed to create price drop notification for buyer ${buyerId}:`, notifError.message);
            if (notifError.message?.includes('invalid input value for enum')) {
              console.error('ENUM ERROR: notification_category enum value might not be in database yet');
            }
          }
        }
      }
    }

    // Check for new disputes
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
          try {
            await db.insert(buyerNotifications).values({
            buyerId,
            type: 'dispute_open' as any,
            title,
            message,
            relatedEntityId: dispute.id,
            relatedEntityType: 'dispute',
            actionUrl: `/buyer/disputes/${dispute.id}`,
            isRead: false,
            isStarred: false,
            metadata: {
              notificationType: `dispute_${dispute.status}`,
              disputeId: dispute.id,
              status: dispute.status,
              subject: dispute.subject,
            },
          });
          } catch (notifError: any) {
            console.error(`Failed to create dispute notification for buyer ${buyerId}:`, notifError.message);
            if (notifError.message?.includes('invalid input value for enum')) {
              console.error('ENUM ERROR: notification_category enum value might not be in database yet');
            }
          }
        }
      }
    }

    // Back in stock notifications - SKIPPED: Schema doesn't have quantity/isActive fields
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
  getAll: protectedProcedure
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
        .select({ count: sql<number>`count(*)::integer` })
        .from(buyerNotifications)
        .where(and(...conditions));

      const total = Number(totalResult[0]?.count ?? 0);

      // Get unread count
      const unreadResult = await db
        .select({ count: sql<number>`count(*)::integer` })
        .from(buyerNotifications)
        .where(and(
          eq(buyerNotifications.buyerId, buyer.id),
          eq(buyerNotifications.isRead, false)
        ));

      const unreadCount = Number(unreadResult[0]?.count ?? 0);

      // Get paginated notifications
      const notifs = await db
        .select()
        .from(buyerNotifications)
        .where(and(...conditions))
        .orderBy(desc(buyerNotifications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return {
        notifications: notifs.map((n: any) => ({
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
   * Get paginated notifications (alias for getAll for consistency)
   */
  getNotifications: protectedProcedure
    .input(
      z.object({
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

      // Generate fresh notifications
      await generateAndStoreBuyerNotifications(buyer.id).catch((err) =>
        console.error('Error generating notifications:', err)
      );

      const notifs = await db
        .select()
        .from(buyerNotifications)
        .where(eq(buyerNotifications.buyerId, buyer.id))
        .orderBy(desc(buyerNotifications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const totalResult = await db
        .select({ count: sql<number>`count(*)::integer` })
        .from(buyerNotifications)
        .where(eq(buyerNotifications.buyerId, buyer.id));

      const total = Number(totalResult[0]?.count ?? 0);

      const unreadResult = await db
        .select({ count: sql<number>`count(*)::integer` })
        .from(buyerNotifications)
        .where(and(
          eq(buyerNotifications.buyerId, buyer.id),
          eq(buyerNotifications.isRead, false)
        ));

      const unreadCount = Number(unreadResult[0]?.count ?? 0);

      return {
        notifications: notifs.map((n: any) => ({
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
      try {
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

        // Use a simpler count query without cast
        const result = await db
          .select({ count: sql<number>`count(*)::integer` })
          .from(buyerNotifications)
          .where(and(
            eq(buyerNotifications.buyerId, buyer.id),
            eq(buyerNotifications.isRead, false)
          ));

        const count = Number(result[0]?.count ?? 0);
        return { count };
      } catch (error) {
        console.error('Error fetching unread count:', error);
        // Fallback: return 0 instead of throwing error
        return { count: 0 };
      }
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

      notifs.forEach((notif: any) => {
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

  /**
   * Get favorited/starred notifications
   */
  getFavorited: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/buyer/notifications/favorited',
        tags: ['Buyer Notifications'],
        summary: 'Get starred/favorited notifications',
      },
    })
    .input(
      z.object({
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

      const notifs = await db
        .select()
        .from(buyerNotifications)
        .where(and(
          eq(buyerNotifications.buyerId, buyer.id),
          eq(buyerNotifications.isStarred, true)
        ))
        .orderBy(desc(buyerNotifications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const totalResult = await db
        .select({ count: sql<number>`count(*)::integer` })
        .from(buyerNotifications)
        .where(and(
          eq(buyerNotifications.buyerId, buyer.id),
          eq(buyerNotifications.isStarred, true)
        ));

      const total = Number(totalResult[0]?.count ?? 0);

      return {
        notifications: notifs.map((n: any) => ({
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
      };
    }),

  /**
   * Clear all notifications
   */
  clearAll: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/buyer/notifications/clear-all',
        tags: ['Buyer Notifications'],
        summary: 'Clear all notifications',
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
        .delete(buyerNotifications)
        .where(eq(buyerNotifications.buyerId, buyer.id));

      return { success: true };
    }),
});
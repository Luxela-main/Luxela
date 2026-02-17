import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { db } from '../db';
import {
  sellerNotifications,
  sellers,
  orders,
  listings,
  disputes,
  listingReviews,
} from '../db/schema';
import { and, eq, gt, lt, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

// Cache to prevent excessive notification generation
const notificationGenerationCache = new Map<string, number>();
const GENERATION_COOLDOWN_MS = 30000; // 30 seconds

function shouldGenerateNotifications(sellerId: string): boolean {
  const lastGeneration = notificationGenerationCache.get(sellerId);
  const now = Date.now();
  
  if (!lastGeneration || now - lastGeneration > GENERATION_COOLDOWN_MS) {
    notificationGenerationCache.set(sellerId, now);
    return true;
  }
  return false;
}

/**
 * Generate fresh seller notifications from system data and persist to database
 * Runs non-blocking to avoid slowing down queries
 */
async function generateAndStoreSellerNotifications(
  sellerId: string
): Promise<void> {
  const now = new Date();

  try {
    // Check for new orders awaiting confirmation
    const newOrders = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.sellerId, sellerId),
        eq(orders.orderStatus, 'pending')
      ))
      .limit(100);

    for (const order of newOrders) {
      const existing = await db
        .select()
        .from(sellerNotifications)
        .where(and(
          eq(sellerNotifications.sellerId, sellerId),
          eq(sellerNotifications.relatedEntityId, order.id),
          sql`${sellerNotifications.metadata}->>'notificationType' = 'new_order'`
        ))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(sellerNotifications).values({
          sellerId,
          type: 'order_pending' as any,
          title: 'New Order Received',
          message: `Order #${order.id.slice(0, 8)} for ${order.currency} ${
            (order.amountCents ?? 0) / 100
          }`,
          severity: 'info' as any,
          relatedEntityId: order.id,
          relatedEntityType: 'order',
          actionUrl: `/seller/orders/${order.id}`,
          isRead: false,
          metadata: {
            notificationType: 'new_order',
            orderId: order.id,
            orderStatus: order.orderStatus,
            amount: (order.amountCents ?? 0) / 100,
            currency: order.currency,
            createdAt: order.createdAt.toISOString(),
          },
        });
      }
    }

    // Check for orders awaiting shipment
    const confirmedOrders = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.sellerId, sellerId),
        eq(orders.orderStatus, 'confirmed')
      ))
      .limit(100);

    for (const order of confirmedOrders) {
      const existing = await db
        .select()
        .from(sellerNotifications)
        .where(and(
          eq(sellerNotifications.sellerId, sellerId),
          eq(sellerNotifications.relatedEntityId, order.id),
          sql`${sellerNotifications.metadata}->>'notificationType' = 'awaiting_shipment'`
        ))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(sellerNotifications).values({
          sellerId,
          type: 'shipment_due' as any,
          title: 'Order Awaiting Shipment',
          message: `Order #${order.id.slice(0, 8)} is ready to ship`,
          severity: 'warning' as any,
          relatedEntityId: order.id,
          relatedEntityType: 'order',
          actionUrl: `/seller/orders/${order.id}`,
          isRead: false,
          metadata: {
            notificationType: 'awaiting_shipment',
            orderId: order.id,
            orderStatus: order.orderStatus,
          },
        });
      }
    }

    // Check for new disputes
    const openDisputes = await db
      .select()
      .from(disputes)
      .where(and(
        eq(disputes.sellerId, sellerId),
        eq(disputes.status, 'open')
      ))
      .limit(50);

    for (const dispute of openDisputes) {
      const existing = await db
        .select()
        .from(sellerNotifications)
        .where(and(
          eq(sellerNotifications.sellerId, sellerId),
          eq(sellerNotifications.relatedEntityId, dispute.id),
          sql`${sellerNotifications.metadata}->>'notificationType' = 'dispute_open'`
        ))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(sellerNotifications).values({
          sellerId,
          type: 'dispute_open' as any,
          title: 'New Dispute',
          message: `Dispute case #${dispute.id.slice(0, 8)} - "${
            dispute.subject
          }" - Amount: ${dispute.currency} ${dispute.amountInDispute}`,
          severity: 'critical' as any,
          relatedEntityId: dispute.id,
          relatedEntityType: 'dispute',
          actionUrl: `/seller/disputes/${dispute.id}`,
          isRead: false,
          metadata: {
            notificationType: 'dispute_open',
            disputeId: dispute.id,
            subject: dispute.subject,
            status: dispute.status,
            amount: dispute.amountInDispute,
          },
        });
      }
    }

    // Check for new reviews on listings
    const recentReviews = await db
      .select()
      .from(listingReviews)
      .where(eq(listingReviews.sellerId, sellerId))
      .limit(50);

    for (const review of recentReviews) {
      const existing = await db
        .select()
        .from(sellerNotifications)
        .where(and(
          eq(sellerNotifications.sellerId, sellerId),
          eq(sellerNotifications.relatedEntityId, review.id),
          sql`${sellerNotifications.metadata}->>'notificationType' = 'new_review'`
        ))
        .limit(1);

      if (existing.length === 0) {
        // Get listing details for notification
        const listing = await db.query.listings.findFirst({
          where: eq(listings.id, review.listingId),
        });

        await db.insert(sellerNotifications).values({
          sellerId,
          type: 'review_request',
          title: `New Review on Listing`,
          message: `Your listing has been reviewed`,
          severity: 'info' as any,
          relatedEntityId: review.id,
          relatedEntityType: 'review',
          actionUrl: `/seller/listings/${review.listingId}/reviews`,
          isRead: false,
          metadata: {
            notificationType: 'new_review',
            reviewId: review.id,
            listingId: review.listingId,
            listingTitle: listing?.title || 'Untitled',
          },
        });
      }
    }

    // Check for low inventory listings
    const lowInventoryListings = await db
      .select()
      .from(listings)
      .where(and(
        eq(listings.sellerId, sellerId),
        gt(listings.quantityAvailable, 0),
        lt(listings.quantityAvailable, 5)
      ))
      .limit(50);

    for (const listing of lowInventoryListings) {
      const existing = await db
        .select()
        .from(sellerNotifications)
        .where(and(
          eq(sellerNotifications.sellerId, sellerId),
          eq(sellerNotifications.relatedEntityId, listing.id),
          sql`${sellerNotifications.metadata}->>'notificationType' = 'low_inventory'`
        ))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(sellerNotifications).values({
          sellerId,
          type: 'system_alert',
          title: 'Low Inventory',
          message: `Listing "${listing.title}" only has ${listing.quantityAvailable} units left`,
          severity: 'warning' as any,
          relatedEntityId: listing.id,
          relatedEntityType: 'listing',
          actionUrl: `/seller/listings/${listing.id}/edit`,
          isRead: false,
          metadata: {
            notificationType: 'low_inventory',
            listingId: listing.id,
            quantity: listing.quantityAvailable,
            title: listing.title,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error generating seller notifications:', error);
  }
}

export const sellerNotificationsRouter = createTRPCRouter({
  /**
   * Get all notifications for seller with real-time support via polling
   * UNIFIED endpoint replacing useNotifications, useSellerNotificationsCount, useUnifiedNotifications
   */
  getNotifications: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/seller/notifications',
        tags: ['Seller Notifications'],
        summary: 'Get real-time notifications for seller dashboard (unified)',
      },
    })
    .input(
      z.object({
        type: z.string().optional(),
        unreadOnly: z.boolean().default(false),
        limit: z.number().int().positive().default(50).catch(50),
        offset: z.number().int().nonnegative().default(0).catch(0),
      }).catch({ unreadOnly: false, type: undefined, limit: 50, offset: 0 })
    )
    .output(z.any())
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.user?.id;
        if (!userId) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
        }

        let seller;
        try {
          seller = await db.query.sellers.findFirst({
            where: eq(sellers.userId, userId),
          });
        } catch (dbError) {
          console.error('[DB_ERROR] Failed to fetch seller', dbError instanceof Error ? dbError.message : String(dbError));
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch seller information',
          });
        }

        if (!seller) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not a seller',
          });
        }

        // Generate fresh notifications (non-blocking background task)
        if (shouldGenerateNotifications(seller.id)) {
          void generateAndStoreSellerNotifications(seller.id).catch((err) => {
            // Silent error - don't block response
          });
        }

        // Build query conditions
        const conditions = [eq(sellerNotifications.sellerId, seller.id)];

        if (input.type) {
          conditions.push(eq(sellerNotifications.type, input.type as any));
        }

        if (input.unreadOnly) {
          conditions.push(eq(sellerNotifications.isRead, false));
        }

        // Get total count
        const totalResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(sellerNotifications)
          .where(and(...conditions));

        const total = totalResult[0]?.count ?? 0;

        // Get unread count (always needed for badge)
        const unreadResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(sellerNotifications)
          .where(and(
            eq(sellerNotifications.sellerId, seller.id),
            eq(sellerNotifications.isRead, false)
          ));

        const unreadCount = unreadResult[0]?.count ?? 0;

        // Get paginated notifications
        const notifs = await db
          .select()
          .from(sellerNotifications)
          .where(and(...conditions))
          .orderBy(desc(sellerNotifications.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        // Transform to JSON-serializable format
        const transformedNotifications = notifs.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          severity: n.severity,
          relatedEntityId: n.relatedEntityId,
          relatedEntityType: n.relatedEntityType,
          actionUrl: n.actionUrl,
          isRead: n.isRead,
          isStarred: n.isStarred,
          createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt),
          metadata: null,
        }));

        if (transformedNotifications.length > 0) {
          console.log('[DEBUG] Sample notification:', JSON.stringify(transformedNotifications[0]));
        }
        
        return {
          notifications: transformedNotifications,
          total,
          unreadCount,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        const errorMsg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
        console.error('[DB_ERROR] getNotifications exception:', errorMsg);
        if (error instanceof Error) {
          console.error('[DB_ERROR] Stack:', error.stack);
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch notifications',
          cause: error,
        });
      }
    }),

  /**
   * Get ONLY unread count for badge (replaces useSellerNotificationsCount)
   * Lightweight query optimized for frequent polling
   */
  getUnreadCount: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/seller/notifications/unread-count',
        tags: ['Seller Notifications'],
        summary: 'Get count of unread notifications (optimized badge query)',
      },
    })
    .input(z.void())
    .output(z.object({ count: z.number() }))
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        // Fail gracefully for unauthenticated requests - prevents blocking buyer page loads
        return { count: 0 };
      }

      const seller = await db.query.sellers.findFirst({
        where: eq(sellers.userId, userId),
      });

      if (!seller) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a seller',
        });
      }

      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(sellerNotifications)
        .where(and(
          eq(sellerNotifications.sellerId, seller.id),
          eq(sellerNotifications.isRead, false)
        ));

      const count = result[0]?.count ?? 0;
      return { count: Number(count) };
    }),

  /**
   * Get notifications by type (orders, disputes, reviews, inventory)
   */
  getNotificationsByType: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/seller/notifications/by-type',
        tags: ['Seller Notifications'],
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
              severity: z.string(),
              createdAt: z.string(),
              unreadCount: z.number(),
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

      const seller = await db.query.sellers.findFirst({
        where: eq(sellers.userId, userId),
      });

      if (!seller) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a seller',
        });
      }

      // Generate fresh notifications (fire-and-forget)
      void generateAndStoreSellerNotifications(seller.id).catch((err) =>
        console.error('Error generating notifications:', err)
      );

      const notifs = await db
        .select()
        .from(sellerNotifications)
        .where(eq(sellerNotifications.sellerId, seller.id))
        .orderBy(desc(sellerNotifications.createdAt));

      const grouped: Record<string, any[]> = {};

      notifs.forEach((notif: typeof notifs[number]) => {
        if (!grouped[notif.type]) {
          grouped[notif.type] = [];
        }
        grouped[notif.type].push({
          id: notif.id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          severity: notif.severity,
          createdAt: notif.createdAt instanceof Date ? notif.createdAt.toISOString() : String(notif.createdAt),
          unreadCount: 0, // Will recalculate after grouping
        });
      });

      // Recalculate unreadCount for each type
      Object.keys(grouped).forEach((type) => {
        const typeNotifs = notifs.filter((n: typeof notifs[number]) => n.type === type);
        const unreadInType = typeNotifs.filter((n: typeof notifs[number]) => !n.isRead).length;
        grouped[type].forEach((item: any) => {
          item.unreadCount = unreadInType;
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
        path: '/seller/notifications/{notificationId}/read',
        tags: ['Seller Notifications'],
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

      const seller = await db.query.sellers.findFirst({
        where: eq(sellers.userId, userId),
      });

      if (!seller) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a seller',
        });
      }

      // Verify ownership before updating
      const notif = await db
        .select()
        .from(sellerNotifications)
        .where(eq(sellerNotifications.id, input.notificationId))
        .limit(1);

      if (notif.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      if (notif[0].sellerId !== seller.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot modify other seller\'s notifications',
        });
      }

      // Update notification
      await db
        .update(sellerNotifications)
        .set({ isRead: true, updatedAt: new Date() })
        .where(eq(sellerNotifications.id, input.notificationId));

      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/seller/notifications/read-all',
        tags: ['Seller Notifications'],
        summary: 'Mark all notifications as read',
      },
    })
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      }

      const seller = await db.query.sellers.findFirst({
        where: eq(sellers.userId, userId),
      });

      if (!seller) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a seller',
        });
      }

      await db
        .update(sellerNotifications)
        .set({ isRead: true, updatedAt: new Date() })
        .where(eq(sellerNotifications.sellerId, seller.id));

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

      const seller = await db.query.sellers.findFirst({
        where: eq(sellers.userId, userId),
      });

      if (!seller) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a seller',
        });
      }

      // Verify ownership
      const notif = await db
        .select()
        .from(sellerNotifications)
        .where(eq(sellerNotifications.id, input.notificationId))
        .limit(1);

      if (notif.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      if (notif[0].sellerId !== seller.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot modify other seller\'s notifications',
        });
      }

      await db
        .update(sellerNotifications)
        .set({ isStarred: input.starred, updatedAt: new Date() })
        .where(eq(sellerNotifications.id, input.notificationId));

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

      const seller = await db.query.sellers.findFirst({
        where: eq(sellers.userId, userId),
      });

      if (!seller) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a seller',
        });
      }

      // Verify ownership
      const notif = await db
        .select()
        .from(sellerNotifications)
        .where(eq(sellerNotifications.id, input.notificationId))
        .limit(1);

      if (notif.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      if (notif[0].sellerId !== seller.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot delete other seller\'s notifications',
        });
      }

      await db
        .delete(sellerNotifications)
        .where(eq(sellerNotifications.id, input.notificationId));

      return { success: true };
    }),

  /**
   * Delete all notifications for a seller
   */
  deleteAllNotifications: protectedProcedure
    .output(z.object({ success: z.literal(true), deletedCount: z.number() }))
    .mutation(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      }

      const seller = await db.query.sellers.findFirst({
        where: eq(sellers.userId, userId),
      });

      if (!seller) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a seller',
        });
      }

      // Get count before deletion for response
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(sellerNotifications)
        .where(eq(sellerNotifications.sellerId, seller.id));

      const deletedCount = countResult[0]?.count ?? 0;

      await db
        .delete(sellerNotifications)
        .where(eq(sellerNotifications.sellerId, seller.id));

      return { success: true, deletedCount };
    }),
});
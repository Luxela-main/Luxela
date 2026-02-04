// Notification mutation endpoints for buyers
// These should be added to the buyer router's createTRPCRouter

import {
  createTRPCRouter,
  protectedProcedure,
} from "../trpc/trpc";
import { db } from "../db";
import { notifications } from "../db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getBuyer } from "./utils";

export const buyerNotificationMutations = {
  markNotificationAsRead: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/buyer/notifications/{notificationId}/read",
        tags: ["Buyer - Notifications"],
        summary: "Mark a notification as read",
        description: "Mark a single notification as read for the buyer",
      },
    })
    .input(z.object({ notificationId: z.string().uuid() }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ input }) => {
      try {
        await db
          .update(notifications)
          .set({ isRead: true })
          .where(eq(notifications.id, input.notificationId));

        return { success: true };
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to mark notification as read",
        });
      }
    }),

  markAllNotificationsAsRead: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/buyer/notifications/read-all",
        tags: ["Buyer - Notifications"],
        summary: "Mark all notifications as read",
        description: "Mark all buyer notifications as read",
      },
    })
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      try {
        const buyer = await getBuyer(userId);

        await db
          .update(notifications)
          .set({ isRead: true })
          .where(
            and(
              eq(notifications.buyerId, buyer.id),
              eq(notifications.isRead, false)
            )
          );

        return { success: true };
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to mark all notifications as read",
        });
      }
    }),

  toggleNotificationFavorite: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/buyer/notifications/{notificationId}/favorite",
        tags: ["Buyer - Notifications"],
        summary: "Toggle notification favorite status",
        description: "Add or remove notification from favorites",
      },
    })
    .input(z.object({ notificationId: z.string().uuid() }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ input }) => {
      try {
        const [existing] = await db
          .select({ isStarred: notifications.isStarred })
          .from(notifications)
          .where(eq(notifications.id, input.notificationId));

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Notification not found",
          });
        }

        await db
          .update(notifications)
          .set({ isStarred: !existing.isStarred })
          .where(eq(notifications.id, input.notificationId));

        return { success: true };
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to toggle notification favorite",
        });
      }
    }),

  deleteNotification: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/buyer/notifications/{notificationId}",
        tags: ["Buyer - Notifications"],
        summary: "Delete a notification",
        description: "Permanently delete a buyer notification",
      },
    })
    .input(z.object({ notificationId: z.string().uuid() }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      try {
        const buyer = await getBuyer(userId);

        // Verify buyer owns the notification
        const existing = await db
          .select()
          .from(notifications)
          .where(
            and(
              eq(notifications.id, input.notificationId),
              eq(notifications.buyerId, buyer.id)
            )
          );

        if (!existing[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Notification not found",
          });
        }

        await db.delete(notifications).where(eq(notifications.id, input.notificationId));

        return { success: true };
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to delete notification",
        });
      }
    }),

  deleteAllNotifications: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/buyer/notifications",
        tags: ["Buyer - Notifications"],
        summary: "Delete all notifications",
        description: "Delete all notifications for the current buyer",
      },
    })
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      try {
        const buyer = await getBuyer(userId);

        await db
          .delete(notifications)
          .where(
            and(
              eq(notifications.buyerId, buyer.id),
              isNull(notifications.sellerId)
            )
          );

        return { success: true };
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to delete all notifications",
        });
      }
    }),
};
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../trpc/trpc";
import { db } from "../db";
import { notifications } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";
import { getSeller } from "./utils";

const NotificationOutput = z.object({
  id: z.string().uuid(),
  sellerId: z.string().uuid(),
  buyerId: z.string().uuid().nullable(),
  orderId: z.string().uuid().nullable(),
  type: z.enum(["purchase", "review", "comment", "reminder", "order_confirmed", "payment_failed", "refund_issued", "delivery_confirmed"]),
  message: z.string(),
  isRead: z.boolean(),
  isStarred: z.boolean(),
  createdAt: z.date(),
});

export const notificationRouter = createTRPCRouter({
  getAll: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/notifications",
        tags: ["Notifications"],
        summary: "Get all notifications for the current seller",
      },
    })
    .output(z.array(NotificationOutput))
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not logged in",
        });

      const seller = await getSeller(userId);

      const rows = await db
        .select()
        .from(notifications)
        .where(eq(notifications.sellerId, seller.id));

      return rows;
    }),

  getStarred: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/notifications/starred",
        tags: ["Notifications"],
        summary: "Get all starred notifications for the current seller",
      },
    })
    .output(z.array(NotificationOutput))
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not logged in",
        });

      const seller = await getSeller(userId);

      const starred = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.sellerId, seller.id),
            eq(notifications.isStarred, true)
          )
        );

      return starred;
    }),

  markAsRead: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/notifications/read",
        tags: ["Notifications"],
        summary: "Mark a notification as read",
      },
    })
    .input(z.object({ notificationId: z.string().uuid() }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ input }) => {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, input.notificationId));

      return { success: true };
    }),

  markAllAsRead: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/notifications/read-all",
        tags: ["Notifications"],
        summary: "Mark all notifications as read for the current seller",
      },
    })
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not logged in",
        });

      const seller = await getSeller(userId);

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.sellerId, seller.id),
            eq(notifications.isRead, false)
          )
        );

      return { success: true };
    }),

  toggleStar: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/notifications/star",
        tags: ["Notifications"],
        summary: "Toggle star on a notification",
      },
    })
    .input(z.object({ notificationId: z.string().uuid() }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ input }) => {
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
    }),

  deleteNotification: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/notifications/{notificationId}",
        tags: ["Notifications"],
        summary: "Delete a notification",
      },
    })
    .input(z.object({ notificationId: z.string().uuid() }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not logged in",
        });

      const seller = await getSeller(userId);

      // Verify seller owns the notification
      const existing = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.id, input.notificationId),
            eq(notifications.sellerId, seller.id)
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
    }),
});
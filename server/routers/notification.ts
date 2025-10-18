import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "../db";
import { notifications, sellers } from "../db/schema";
import { eq, and  } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";

async function ensureSeller(userId: string) {
  const seller = await db
    .select()
    .from(sellers)
    .where(eq(sellers.userId, userId));

  if (!seller[0]) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not registered as a seller",
    });
  }

  return seller[0];
}


const NotificationOutput = z.object({
  id: z.string().uuid(),
  sellerId: z.string().uuid(),
  type: z.enum(["purchase", "review", "comment", "reminder"]),
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
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User not logged in" });

      const seller = await ensureSeller(userId);

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
      throw new TRPCError({ code: "UNAUTHORIZED", message: "User not logged in" });

    const seller = await db
      .select()
      .from(sellers)
      .where(eq(sellers.userId, userId));

    if (!seller[0]) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not registered as a seller",
      });
    }

    const starred = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.sellerId, seller[0].id),
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
      throw new TRPCError({ code: "NOT_FOUND", message: "Notification not found" });
    }

    await db
      .update(notifications)
      .set({ isStarred: !existing.isStarred })
      .where(eq(notifications.id, input.notificationId));

    return { success: true };
  }),


});

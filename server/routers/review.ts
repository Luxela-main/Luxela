import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { db } from "../db";
import { reviews, listings, notifications } from "../db/schema";
import { randomUUID } from "crypto";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const reviewRouter = createTRPCRouter({
  createReview: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/reviews",
        tags: ["Reviews"],
        summary: "Create a new review",
      },
    })
    .input(
      z.object({
        listingId: z.string().uuid(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const buyerId = ctx.user?.id;
      if (!buyerId)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      const [newReview] = await db
        .insert(reviews)
        .values({
          id: randomUUID(),
          listingId: input.listingId,
          buyerId,
          rating: input.rating,
          comment: input.comment,
        })
        .returning();

      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, input.listingId));

      if (listing) {
        await db.insert(notifications).values({
          id: randomUUID(),
          sellerId: listing.sellerId,
          type: "review",
          message: `New review on ${listing.title}`,
          isRead: false,
          isStarred: false,
          createdAt: new Date(),
        });
      }

      return newReview;
    }),

  getReviewsByListing: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/reviews/:listingId",
        tags: ["Reviews"],
        summary: "Get all reviews for a listing",
      },
    })
    .input(z.object({ listingId: z.string().uuid() }))
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(reviews)
        .where(eq(reviews.listingId, input.listingId))
        .orderBy(desc(reviews.createdAt));

      return rows;
    }),
});

import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc/trpc";
import { db } from "../db";
import { reviews, listings, notifications } from "../db/schema";
import { v4 as uuidv4 } from "uuid";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const reviewSchema = z.object({
  id: z.string().uuid(),
  listingId: z.string().uuid(),
  buyerId: z.string().uuid(),
  rating: z.number(),
  comment: z.string().nullable().optional(),
  createdAt: z.date(),
});

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
    .output(reviewSchema)
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
          id: uuidv4(),
          listingId: input.listingId,
          buyerId,
          rating: input.rating,
          comment: input.comment ?? null,
          createdAt: new Date(),
        })
        .returning();

      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, input.listingId));

      if (listing) {
        await db.insert(notifications).values({
          id: uuidv4(),
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
    .output(z.array(reviewSchema))
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(reviews)
        .where(eq(reviews.listingId, input.listingId))
        .orderBy(desc(reviews.createdAt));

      return rows;
    }),
});

import { createTRPCRouter, protectedProcedure } from "../trpc/trpc";
import { db } from "../db";
import { listings, listingReviews, sellers } from "../db/schema";
import { eq, count as countFn } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { TRPCContext } from "../trpc/context";

async function verifySeller(ctx: TRPCContext) {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  const sellerRows = await db.query.sellers.findMany({
    where: eq(sellers.userId, ctx.user.id),
  });

  if (!sellerRows.length) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Not a seller",
    });
  }

  return sellerRows[0];
}

export const sellerListingNotificationsRouter = createTRPCRouter({
  getListingStatusNotifications: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/seller/listing-notifications",
        tags: ["Seller Listing Notifications"],
        summary: "Get listing status notifications for seller",
      },
    })
    .input(
      z.object({
        page: z.number().int().positive().optional().default(1),
        limit: z.number().int().positive().max(100).optional().default(20),
      })
    )
    .output(
      z.object({
        notifications: z.array(
          z.object({
            id: z.string().uuid(),
            listingId: z.string().uuid(),
            title: z.string(),
            status: z.enum([
              "pending",
              "approved",
              "rejected",
              "revision_requested",
            ]),
            comments: z.string().nullable().optional(),
            rejectionReason: z.string().nullable().optional(),
            revisionRequests: z.record(z.string(), z.any()).nullable().optional(),
            reviewedAt: z.date().nullable().optional(),
            createdAt: z.date(),
          })
        ),
        total: z.number(),
        page: z.number(),
        totalPages: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const seller = await verifySeller(ctx);

      const offset = (input.page - 1) * input.limit;

      // Get total count
      const countResult = await db
        .select({ count: countFn() })
        .from(listingReviews)
        .where(eq(listingReviews.sellerId, seller.id));

      const total = Number(countResult[0]?.count ?? 0);

      // Get paginated notifications
      const result = await db
        .select({
          review: listingReviews,
          listing: listings,
        })
        .from(listingReviews)
        .innerJoin(listings, eq(listingReviews.listingId, listings.id))
        .where(eq(listingReviews.sellerId, seller.id))
        .limit(input.limit)
        .offset(offset);

      const notifications = result.map((item: any) => ({
        id: item.review.id,
        listingId: item.review.listingId,
        title: item.listing.title,
        status: item.review.status,
        comments: item.review.comments || undefined,
        rejectionReason: item.review.rejectionReason || undefined,
        revisionRequests: item.review.revisionRequests || undefined,
        reviewedAt: item.review.reviewedAt || undefined,
        createdAt: item.review.createdAt,
      }));

      const totalPages = Math.ceil(total / input.limit);

      return {
        notifications,
        total,
        page: input.page,
        totalPages,
      };
    }),

  getListingDetails: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/seller/listing/{listingId}/details",
        tags: ["Seller Listing Notifications"],
        summary: "Get detailed listing feedback from review",
      },
    })
    .input(z.object({ listingId: z.string().uuid() }))
    .output(
      z.object({
        listing: z.object({
          id: z.string().uuid(),
          title: z.string(),
          status: z.enum([
            "draft",
            "pending_review",
            "approved",
            "rejected",
            "archived",
          ]),
          createdAt: z.date(),
        }),
        review: z.object({
          id: z.string().uuid(),
          status: z.enum([
            "pending",
            "approved",
            "rejected",
            "revision_requested",
          ]),
          comments: z.string().nullable().optional(),
          rejectionReason: z.string().nullable().optional(),
          revisionRequests: z.record(z.string(), z.any()).nullable().optional(),
          reviewedAt: z.date().nullable().optional(),
          reviewedBy: z.string().nullable().optional(),
        }),
      })
    )
    .query(async ({ ctx, input }) => {
      const seller = await verifySeller(ctx);

      const result = await db
        .select({
          listing: listings,
          review: listingReviews,
        })
        .from(listingReviews)
        .innerJoin(listings, eq(listingReviews.listingId, listings.id))
        .where(
          eq(
            listingReviews.listingId,
            input.listingId
          )
        )
        .limit(1);

      if (!result.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Listing not found",
        });
      }

      const item = result[0];

      // Verify seller owns this listing
      if (item.listing.sellerId !== seller.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Can only access your own listings",
        });
      }

      return {
        listing: {
          id: item.listing.id,
          title: item.listing.title,
          status: item.listing.status,
          createdAt: item.listing.createdAt,
        },
        review: {
          id: item.review.id,
          status: item.review.status,
          comments: item.review.comments || undefined,
          rejectionReason: item.review.rejectionReason || undefined,
          revisionRequests: item.review.revisionRequests || undefined,
          reviewedAt: item.review.reviewedAt || undefined,
          reviewedBy: item.review.reviewedBy || undefined,
        },
      };
    }),

  pollForNotifications: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/seller/notifications/poll",
        tags: ["Seller Listing Notifications"],
        summary: "Poll for new listing notifications (real-time via polling)",
      },
    })
    .input(
      z.object({
        lastPolledAt: z.date().optional(),
      })
    )
    .output(
      z.object({
        newNotifications: z.array(
          z.object({
            id: z.string().uuid(),
            listingId: z.string().uuid(),
            title: z.string(),
            status: z.enum([
              "pending",
              "approved",
              "rejected",
              "revision_requested",
            ]),
            message: z.string(),
            comments: z.string().nullable().optional(),
            rejectionReason: z.string().nullable().optional(),
            revisionRequests: z.record(z.string(), z.any()).nullable().optional(),
            reviewedAt: z.date().nullable().optional(),
            isNew: z.boolean(),
          })
        ),
        hasMore: z.boolean(),
        pollAgainInSeconds: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const seller = await verifySeller(ctx);

      const lastPolledAt = input.lastPolledAt || new Date(Date.now() - 5 * 60 * 1000);

      const newReviews = await db
        .select({
          review: listingReviews,
          listing: listings,
        })
        .from(listingReviews)
        .innerJoin(listings, eq(listingReviews.listingId, listings.id))
        .where(
          eq(listingReviews.sellerId, seller.id)
        )
        .orderBy((t: any) => t.review.updatedAt)
        .limit(50);

      const now = new Date();
      const newNotifications = newReviews
        .filter((item: typeof newReviews[number]) => item.review.updatedAt > lastPolledAt)
        .map((item: typeof newReviews[number]) => {
          const status = item.review.status;
          let message = "";
          
          switch (status) {
            case "approved":
              message = `Your listing "${item.listing.title}" has been approved and is now live!`;
              break;
            case "rejected":
              message = `Your listing "${item.listing.title}" has been rejected. Please review the feedback.`;
              break;
            case "revision_requested":
              message = `Revision requested for "${item.listing.title}". Please make the necessary changes.`;
              break;
            default:
              message = `Your listing "${item.listing.title}" is under review.`;
          }

          return {
            id: item.review.id,
            listingId: item.review.listingId,
            title: item.listing.title,
            status: item.review.status,
            message,
            comments: item.review.comments || undefined,
            rejectionReason: item.review.rejectionReason || undefined,
            revisionRequests: item.review.revisionRequests || undefined,
            reviewedAt: item.review.reviewedAt || undefined,
            isNew: item.review.updatedAt > lastPolledAt,
          };
        });

      return {
        newNotifications,
        hasMore: newNotifications.length >= 50,
        pollAgainInSeconds: 10,
      };
    }),

  getUnreadCount: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/seller/listing-notifications/unread-count",
        tags: ["Seller Listing Notifications"],
        summary: "Get count of unread listing notifications for badge",
      },
    })
    .output(z.object({ count: z.number() }))
    .query(async ({ ctx }) => {
      const seller = await verifySeller(ctx);

      const countResult = await db
        .select({ count: countFn() })
        .from(listingReviews)
        .where(eq(listingReviews.sellerId, seller.id));

      const total = Number(countResult[0]?.count ?? 0);

      return { count: total };
    }),

  resubmitListing: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/seller/listing/{listingId}/resubmit",
        tags: ["Seller Listing Notifications"],
        summary: "Resubmit listing after rejection or revision request",
      },
    })
    .input(
      z.object({
        listingId: z.string().uuid(),
        updates: z.record(z.string(), z.any()).optional(),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const seller = await verifySeller(ctx);

      const listing = await db.query.listings.findFirst({
        where: eq(listings.id, input.listingId),
      });

      if (!listing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Listing not found",
        });
      }

      // Verify seller owns this listing
      if (listing.sellerId !== seller.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Can only update your own listings",
        });
      }

      // Verify listing is in a state that allows resubmission
      if (
        listing.status !== "rejected" &&
        listing.status !== "pending_review"
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Listing cannot be resubmitted in current status",
        });
      }

      // Update listing status back to pending_review
      await db
        .update(listings)
        .set({
          status: "pending_review",
          updatedAt: new Date(),
        })
        .where(eq(listings.id, input.listingId));

      // Reset review status to pending
      await db
        .update(listingReviews)
        .set({
          status: "pending",
          reviewedBy: null,
          reviewedAt: null,
          rejectionReason: null,
          comments: null,
          revisionRequests: null,
          updatedAt: new Date(),
        })
        .where(eq(listingReviews.listingId, input.listingId));

      return { success: true };
    }),
});
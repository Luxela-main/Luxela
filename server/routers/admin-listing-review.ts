import { createTRPCRouter, protectedProcedure } from "../trpc/trpc";
import { db } from "../db";
import {
  listings,
  listingReviews,
  listingActivityLog,
  sellers,
  brands,
} from "../db/schema";
import { eq, and, desc, count as countFn, inArray } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { TRPCContext } from "../trpc/context";

async function verifyAdminRole(ctx: TRPCContext) {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
}

export const adminListingReviewRouter = createTRPCRouter({
  getPendingListings: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/admin/listings/pending",
        tags: ["Admin Listing Review"],
        summary: "Get pending listings for review",
      },
    })
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
        status: z
          .enum(["pending", "approved", "rejected", "revision_requested"])
          .optional(),
        sortBy: z.enum(["newest", "oldest"]).default("newest"),
      })
    )
    .output(
      z.object({
        listings: z.array(
          z.object({
            id: z.string().uuid(),
            listingId: z.string().uuid(),
            sellerId: z.string().uuid(),
            title: z.string(),
            description: z.string().optional(),
            price: z.number().optional(),
            image: z.string().optional(),
            status: z.enum([
              "draft",
              "pending_review",
              "approved",
              "rejected",
              "archived",
            ]),
            reviewStatus: z.enum([
              "pending",
              "approved",
              "rejected",
              "revision_requested",
            ]),
            comments: z.string().nullable().optional(),
            rejectionReason: z.string().nullable().optional(),
            createdAt: z.date(),
            reviewedAt: z.date().nullable().optional(),
            reviewedBy: z.string().nullable().optional(),
          })
        ),
        total: z.number(),
        page: z.number(),
        totalPages: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      const offset = (input.page - 1) * input.limit;

      // Filter by review status if provided
      const statusCondition = input.status
        ? eq(listingReviews.status, input.status)
        : inArray(listingReviews.status, ["pending", "revision_requested"]);

      // Get total count
      const countResult = await db
        .select({ count: countFn() })
        .from(listingReviews)
        .where(statusCondition);

      const total = Number(countResult[0]?.count ?? 0);

      // Get paginated results
      const result = await db
        .select({
          review: listingReviews,
          listing: listings,
          seller: sellers,
        })
        .from(listingReviews)
        .innerJoin(listings, eq(listingReviews.listingId, listings.id))
        .innerJoin(sellers, eq(listingReviews.sellerId, sellers.id))
        .where(statusCondition)
        .orderBy(
          input.sortBy === "newest"
            ? desc(listings.createdAt)
            : listings.createdAt
        )
        .limit(input.limit)
        .offset(offset);

      const formattedListings = result.map((item) => ({
        id: item.review.id,
        listingId: item.review.listingId,
        sellerId: item.review.sellerId,
        title: item.listing.title,
        description: item.listing.description || undefined,
        price: item.listing.priceCents
          ? item.listing.priceCents / 100
          : undefined,
        image: item.listing.image || undefined,
        status: item.listing.status,
        reviewStatus: item.review.status,
        comments: item.review.comments,
        rejectionReason: item.review.rejectionReason,
        createdAt: item.listing.createdAt,
        reviewedAt: item.review.reviewedAt,
        reviewedBy: item.review.reviewedBy,
      }));

      const totalPages = Math.ceil(total / input.limit);

      return {
        listings: formattedListings,
        total,
        page: input.page,
        totalPages,
      };
    }),

  getListingDetails: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/admin/listings/{listingId}",
        tags: ["Admin Listing Review"],
        summary: "Get full listing details for review",
      },
    })
    .input(z.object({ listingId: z.string().uuid() }))
    .output(
      z.object({
        id: z.string().uuid(),
        listingId: z.string().uuid(),
        sellerId: z.string().uuid(),
        title: z.string(),
        description: z.string().optional(),
        price: z.number().optional(),
        image: z.string().optional(),
        imagesJson: z.string().optional(),
        category: z.string().nullable().optional(),
        status: z.enum([
          "draft",
          "pending_review",
          "approved",
          "rejected",
          "archived",
        ]),
        reviewStatus: z.enum([
          "pending",
          "approved",
          "rejected",
          "revision_requested",
        ]),
        comments: z.string().nullable().optional(),
        rejectionReason: z.string().nullable().optional(),
        revisionRequests: z.record(z.string(), z.any()).nullable(),
        createdAt: z.date(),
        reviewedAt: z.date().nullable().optional(),
        reviewedBy: z.string().nullable().optional(),
        seller: z.object({
          id: z.string().uuid(),
          brandName: z.string().optional(),
        }),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      const result = await db
        .select({
          review: listingReviews,
          listing: listings,
          seller: sellers,
          brand: brands,
        })
        .from(listingReviews)
        .innerJoin(listings, eq(listingReviews.listingId, listings.id))
        .innerJoin(sellers, eq(listingReviews.sellerId, sellers.id))
        .leftJoin(brands, eq(sellers.brandId, brands.id))
        .where(eq(listingReviews.listingId, input.listingId))
        .limit(1);

      if (!result.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Listing not found",
        });
      }

      const item = result[0];

      return {
        id: item.review.id,
        listingId: item.review.listingId,
        sellerId: item.review.sellerId,
        title: item.listing.title,
        description: item.listing.description || undefined,
        price: item.listing.priceCents
          ? item.listing.priceCents / 100
          : undefined,
        image: item.listing.image || undefined,
        imagesJson: item.listing.imagesJson || undefined,
        category: (item.listing.category || undefined) as string | undefined | null,
        status: item.listing.status,
        reviewStatus: item.review.status,
        comments: item.review.comments || undefined,
        rejectionReason: item.review.rejectionReason || undefined,
        revisionRequests: item.review.revisionRequests ? (item.review.revisionRequests as Record<string, any>) : null,
        createdAt: item.listing.createdAt,
        reviewedAt: item.review.reviewedAt,
        reviewedBy: item.review.reviewedBy,
        seller: {
          id: item.seller.id,
          brandName: item.brand?.name || undefined,
        },
      } as any;
    }),

  approveListing: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/admin/listings/approve",
        tags: ["Admin Listing Review"],
        summary: "Approve a listing for publishing",
      },
    })
    .input(
      z.object({
        listingId: z.string().uuid(),
        comments: z.string().optional(),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      const listing = await db.query.listings.findFirst({
        where: eq(listings.id, input.listingId),
      });

      if (!listing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Listing not found",
        });
      }

      // Update listing status
      await db
        .update(listings)
        .set({ status: "approved", updatedAt: new Date() })
        .where(eq(listings.id, input.listingId));

      // Update review status
      await db
        .update(listingReviews)
        .set({
          status: "approved",
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          comments: input.comments,
          updatedAt: new Date(),
        })
        .where(eq(listingReviews.listingId, input.listingId));

      // Log activity
      await db.insert(listingActivityLog).values({
        listingId: input.listingId,
        sellerId: listing.sellerId,
        action: "listing_approved",
        actionType: "approval",
        details: {
          comments: input.comments,
        },
        performedBy: ctx.user.id,
        performedByRole: ctx.user.role as any,
      });

      return { success: true };
    }),

  rejectListing: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/admin/listings/reject",
        tags: ["Admin Listing Review"],
        summary: "Reject a listing",
      },
    })
    .input(
      z.object({
        listingId: z.string().uuid(),
        reason: z.string().min(10, "Rejection reason must be at least 10 characters"),
        comments: z.string().optional(),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      const listing = await db.query.listings.findFirst({
        where: eq(listings.id, input.listingId),
      });

      if (!listing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Listing not found",
        });
      }

      // Update listing status
      await db
        .update(listings)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(eq(listings.id, input.listingId));

      // Update review status
      await db
        .update(listingReviews)
        .set({
          status: "rejected",
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          rejectionReason: input.reason,
          comments: input.comments,
          updatedAt: new Date(),
        })
        .where(eq(listingReviews.listingId, input.listingId));

      // Log activity
      await db.insert(listingActivityLog).values({
        listingId: input.listingId,
        sellerId: listing.sellerId,
        action: "listing_rejected",
        actionType: "rejection",
        details: {
          reason: input.reason,
          comments: input.comments,
        },
        performedBy: ctx.user.id,
        performedByRole: ctx.user.role as any,
      });

      return { success: true };
    }),

  requestRevision: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/admin/listings/request-revision",
        tags: ["Admin Listing Review"],
        summary: "Request revision from seller",
      },
    })
    .input(
      z.object({
        listingId: z.string().uuid(),
        revisionRequests: z.record(
          z.string(),
          z.object({
            field: z.string(),
            issue: z.string(),
            suggestion: z.string().optional(),
          })
        ),
        comments: z.string().optional(),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      const listing = await db.query.listings.findFirst({
        where: eq(listings.id, input.listingId),
      });

      if (!listing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Listing not found",
        });
      }

      // Update listing status back to pending_review
      await db
        .update(listings)
        .set({ status: "pending_review", updatedAt: new Date() })
        .where(eq(listings.id, input.listingId));

      // Update review status
      await db
        .update(listingReviews)
        .set({
          status: "revision_requested",
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          revisionRequests: input.revisionRequests,
          comments: input.comments,
          updatedAt: new Date(),
        })
        .where(eq(listingReviews.listingId, input.listingId));

      // Log activity
      await db.insert(listingActivityLog).values({
        listingId: input.listingId,
        sellerId: listing.sellerId,
        action: "revision_requested",
        actionType: "revision_request",
        details: {
          revisionRequests: input.revisionRequests,
          comments: input.comments,
        },
        performedBy: ctx.user.id,
        performedByRole: ctx.user.role as any,
      });

      return { success: true };
    }),

  getActivityHistory: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/admin/listings/{listingId}/activity",
        tags: ["Admin Listing Review"],
        summary: "Get activity history for a listing",
      },
    })
    .input(z.object({ listingId: z.string().uuid() }))
    .output(
      z.array(
        z.object({
          id: z.string().uuid(),
          action: z.string(),
          actionType: z.string(),
          performedBy: z.string().optional(),
          performedByRole: z.string().optional(),
          details: z.record(z.string(), z.any()).optional(),
          createdAt: z.date(),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      const result = await db.query.listingActivityLog.findMany({
        where: eq(listingActivityLog.listingId, input.listingId),
        orderBy: desc(listingActivityLog.createdAt),
      });

      return result.map((item) => ({
        id: item.id,
        action: item.action,
        actionType: item.actionType,
        performedBy: item.performedBy ?? undefined,
        performedByRole: item.performedByRole ?? undefined,
        details: item.details as Record<string, any> | undefined,
        createdAt: item.createdAt,
      }));
    }),

  getDashboardStats: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/admin/listings/stats",
        tags: ["Admin Listing Review"],
        summary: "Get admin dashboard statistics",
      },
    })
    .output(
      z.object({
        pending: z.number(),
        approved: z.number(),
        rejected: z.number(),
        revision_requested: z.number(),
        total: z.number(),
      })
    )
    .query(async ({ ctx }) => {
      await verifyAdminRole(ctx);

      const pendingCount = await db
        .select({ count: countFn() })
        .from(listingReviews)
        .where(eq(listingReviews.status, "pending"));

      const approvedCount = await db
        .select({ count: countFn() })
        .from(listingReviews)
        .where(eq(listingReviews.status, "approved"));

      const rejectedCount = await db
        .select({ count: countFn() })
        .from(listingReviews)
        .where(eq(listingReviews.status, "rejected"));

      const revisionCount = await db
        .select({ count: countFn() })
        .from(listingReviews)
        .where(eq(listingReviews.status, "revision_requested"));

      const total = await db
        .select({ count: countFn() })
        .from(listingReviews);

      return {
        pending: Number(pendingCount[0]?.count ?? 0),
        approved: Number(approvedCount[0]?.count ?? 0),
        rejected: Number(rejectedCount[0]?.count ?? 0),
        revision_requested: Number(revisionCount[0]?.count ?? 0),
        total: Number(total[0]?.count ?? 0),
      };
    }),
});
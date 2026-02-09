import { createTRPCRouter, protectedProcedure } from "../trpc/trpc";
import { db } from "../db";
import {
  listings,
  listingReviews,
  listingActivityLog,
  sellers,
  brands,
  products,
  collectionItems,
  users,
  sellerBusiness,
  collections,
  productImages,
} from "../db/schema";
import { eq, and, desc, count as countFn, inArray, avg, min, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { TRPCContext } from "../trpc/context";
import {
  notifyListingApproved,
  notifyListingRejected,
  notifyListingRevisionRequest,
} from "../services/listingNotificationService";

async function verifyAdminRole(ctx: TRPCContext) {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  if (!ctx.user.admin) {
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
            category: z.string().nullable().optional(),
            sellerName: z.string().optional(),
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
            type: z.enum(['single', 'collection']).optional(),
            collectionItemCount: z.number().optional(),
            collectionTotalPrice: z.number().optional(),
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
          brand: brands,
          sellerUser: users,
        })
        .from(listingReviews)
        .innerJoin(listings, eq(listingReviews.listingId, listings.id))
        .innerJoin(sellers, eq(listingReviews.sellerId, sellers.id))
        .leftJoin(brands, eq(sellers.brandId, brands.id))
        .leftJoin(users, eq(sellers.userId, users.id))
        .where(statusCondition)
        .orderBy(
          input.sortBy === "newest"
            ? desc(listings.createdAt)
            : listings.createdAt
        )
        .limit(input.limit)
        .offset(offset);

      // For collection listings, fetch all items and calculate total price
      const collectionListingIds = result
        .filter((item) => item.listing.type === 'collection')
        .map((item) => item.listing.id);

      let collectionData: Record<string, { itemCount: number; totalPrice: number }> = {};
      if (collectionListingIds.length > 0) {
        // Fetch all collection items with product prices
        const collectionItemsData = await db
          .select({
            listingId: listings.id,
            productId: products.id,
            priceCents: products.priceCents,
          })
          .from(listings)
          .innerJoin(collectionItems, eq(listings.collectionId, collectionItems.collectionId))
          .innerJoin(products, eq(collectionItems.productId, products.id))
          .where(inArray(listings.id, collectionListingIds));

        // Process collection data
        collectionItemsData.forEach((row) => {
          if (row.listingId) {
            if (!collectionData[row.listingId]) {
              collectionData[row.listingId] = { itemCount: 0, totalPrice: 0 };
            }
            collectionData[row.listingId].itemCount += 1;
            collectionData[row.listingId].totalPrice += row.priceCents / 100;
          }
        });
      }

      const formattedListings = result.map((item) => {
        const isCollection = item.listing.type === 'collection';
        let price: number | undefined;
        let collectionItemCount: number | undefined;
        let collectionTotalPrice: number | undefined;

        if (isCollection && collectionData[item.listing.id]) {
          collectionItemCount = collectionData[item.listing.id].itemCount;
          collectionTotalPrice = collectionData[item.listing.id].totalPrice;
          price = collectionTotalPrice; // Use total price for display
        } else if (!isCollection) {
          price = item.listing.priceCents ? item.listing.priceCents / 100 : undefined;
        }

        return {
          id: item.review.id,
          listingId: item.review.listingId,
          sellerId: item.review.sellerId,
          title: item.listing.title,
          description: item.listing.description || undefined,
          price,
          image: item.listing.image || undefined,
          category: (item.listing.category || null) as string | null,
          sellerName: item.brand?.name || item.sellerUser?.name || 'Unknown Seller',
          type: item.listing.type,
          status: item.listing.status,
          reviewStatus: item.review.status,
          comments: item.review.comments,
          rejectionReason: item.review.rejectionReason,
          createdAt: item.listing.createdAt,
          reviewedAt: item.review.reviewedAt,
          reviewedBy: item.review.reviewedBy,
          collectionItemCount,
          collectionTotalPrice,
        };
      });

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
        description: z.string().nullable().optional(),
        price: z.number().optional(),
        image: z.string().optional(),
        images: z.array(z.string()).optional(),
        imagesJson: z.string().optional(),
        category: z.string().nullable().optional(),
        priceCents: z.number().nullable().optional(),
        currency: z.string().nullable().optional(),
        quantityAvailable: z.number().nullable().optional(),
        supplyCapacity: z.string().nullable().optional(),
        sizes: z.array(z.string()).nullable().optional(),
        colors: z.array(z.object({
          colorName: z.string(),
          colorHex: z.string(),
        })).nullable().optional(),
        materialComposition: z.string().nullable().optional(),
        shippingOption: z.string().nullable().optional(),
        etaDomestic: z.string().nullable().optional(),
        etaInternational: z.string().nullable().optional(),
        refundPolicy: z.string().nullable().optional(),
        localPricing: z.string().nullable().optional(),
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
        sku: z.string().nullable().optional(),
        slug: z.string().nullable().optional(),
        metaDescription: z.string().nullable().optional(),
        barcode: z.string().nullable().optional(),
        videoUrl: z.string().nullable().optional(),
        careInstructions: z.string().nullable().optional(),
        limitedEditionBadge: z.string().nullable().optional(),
        releaseDuration: z.string().nullable().optional(),
        additionalTargetAudience: z.string().nullable().optional(),
        type: z.enum(['single', 'collection']).optional(),
        seller: z.object({
          id: z.string().uuid(),
          brandName: z.string().optional(),
          email: z.string().optional(),
          phoneNumber: z.string().optional(),
          businessAddress: z.string().optional(),
          businessType: z.string().optional(),
        }),
        // Collection details
        collectionId: z.string().uuid().nullable().optional(),
        collectionName: z.string().nullable().optional(),
        collectionDescription: z.string().nullable().optional(),
        collectionItemCount: z.number().optional(),
        collectionTotalPrice: z.number().optional(),
        collectionProducts: z.array(z.object({
          id: z.string().uuid(),
          title: z.string(),
          description: z.string().nullable().optional(),
          priceCents: z.number(),
          currency: z.string(),
          sku: z.string().nullable().optional(),
          category: z.string().nullable().optional(),
          images: z.array(z.string()),
          imagesJson: z.string().nullable().optional(),
          material: z.string().nullable().optional(),
          weight: z.string().nullable().optional(),
          dimensions: z.string().nullable().optional(),
          origin: z.string().nullable().optional(),
          careInstructions: z.string().nullable().optional(),
          tags: z.array(z.string()).nullable().optional(),
        })).nullable().optional(),
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
          sellerUser: users,
          sellerBizInfo: sellerBusiness,
        })
        .from(listingReviews)
        .innerJoin(listings, eq(listingReviews.listingId, listings.id))
        .innerJoin(sellers, eq(listingReviews.sellerId, sellers.id))
        .leftJoin(brands, eq(sellers.brandId, brands.id))
        .leftJoin(users, eq(sellers.userId, users.id))
        .leftJoin(sellerBusiness, eq(sellers.id, sellerBusiness.sellerId))
        .where(eq(listingReviews.listingId, input.listingId))
        .limit(1);

      if (!result.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Listing not found",
        });
      }

      const item = result[0];

      // Get collection price if it's a collection listing
      let price = item.listing.priceCents
        ? item.listing.priceCents / 100
        : undefined;

      let collectionProducts = null;
      let collectionName = null;
      let collectionDescription = null;

      if (item.listing.type === 'collection' && item.listing.collectionId) {
        // Fetch collection metadata
        const collectionData = await db
          .select()
          .from(collections)
          .where(eq(collections.id, item.listing.collectionId))
          .limit(1);

        if (collectionData.length > 0) {
          collectionName = collectionData[0].name;
          collectionDescription = collectionData[0].description;
        }
        const collectionPrice = await db
          .select({ minPrice: min(products.priceCents) })
          .from(collectionItems)
          .innerJoin(products, eq(collectionItems.productId, products.id))
          .where(eq(collectionItems.collectionId, item.listing.collectionId))
          .limit(1);

        if (collectionPrice[0]?.minPrice) {
          price = collectionPrice[0].minPrice / 100;
        }

        // Fetch all collection items with full product details and images
        const collectionItemsList = await db
          .select()
          .from(collectionItems)
          .where(eq(collectionItems.collectionId, item.listing.collectionId))
          .orderBy(collectionItems.position);

        if (collectionItemsList.length > 0) {
          const productIds = collectionItemsList.map(item => item.productId);

          // Fetch all products in the collection
          const productsInCollection = await db
            .select()
            .from(products)
            .where(inArray(products.id, productIds));

          // Fetch all listings for these products to get care instructions
          const productListings = await db
            .select()
            .from(listings)
            .where(inArray(listings.productId, productIds));

          // Fetch all images for all products in one query
          const allProductImages = await db
            .select()
            .from(productImages)
            .where(inArray(productImages.productId, productIds))
            .orderBy(productImages.position);

          // Build map of images by product ID
          const imagesByProductId: Record<string, string[]> = {};
          allProductImages.forEach(img => {
            if (!imagesByProductId[img.productId]) {
              imagesByProductId[img.productId] = [];
            }
            imagesByProductId[img.productId].push(img.imageUrl);
          });

          // Build map of care instructions by product ID
          const careInstructionsByProductId: Record<string, string | null> = {};
          productListings.forEach(listing => {
            if (listing.productId) {
              careInstructionsByProductId[listing.productId] = listing.careInstructions || null;
            }
          });

          // Build collection products array
          collectionProducts = collectionItemsList
            .map(collectionItem => {
              const product = productsInCollection.find(p => p.id === collectionItem.productId);
              if (!product) return null;

              const productImages = imagesByProductId[product.id] || [];
              const imagesJsonStr = productImages.length > 0 
                ? JSON.stringify(productImages.map(url => ({ url })))
                : null;

              return {
                id: product.id,
                title: product.name,
                description: product.description,
                priceCents: product.priceCents,
                currency: product.currency || 'NGN',
                sku: product.sku,
                category: product.category,
                images: productImages,
                imagesJson: imagesJsonStr,
                careInstructions: careInstructionsByProductId[product.id] || null,
              };
            })
            .filter((p) => p !== null);
        }
      }

      // Fetch images for single listings
      let images: string[] = [];
      if (item.listing.type === 'single' && item.listing.productId) {
        const productImgData = await db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, item.listing.productId))
          .orderBy(productImages.position);
        images = productImgData.map(img => img.imageUrl);
      }

      // Parse sizes and colors if available
      let sizes = null;
      let colors = null;
      if (item.listing.sizesJson) {
        try {
          sizes = JSON.parse(item.listing.sizesJson);
        } catch (e) {
          sizes = null;
        }
      }
      if (item.listing.colorsAvailable) {
        try {
          colors = JSON.parse(item.listing.colorsAvailable);
        } catch (e) {
          colors = null;
        }
      }

      const responseData: any = {
        id: item.review.id,
        listingId: item.review.listingId,
        sellerId: item.review.sellerId,
        title: item.listing.title,
        description: item.listing.description || null,
        price,
        priceCents: item.listing.priceCents || null,
        currency: item.listing.currency || null,
        image: item.listing.image || undefined,
        images: images.length > 0 ? images : undefined,
        imagesJson: item.listing.imagesJson || undefined,
        category: (item.listing.category || undefined) as string | null,
        quantityAvailable: item.listing.quantityAvailable || null,
        supplyCapacity: item.listing.supplyCapacity || null,
        sizes: sizes || undefined,
        colors: colors || undefined,
        materialComposition: item.listing.materialComposition || null,
        shippingOption: item.listing.shippingOption || null,
        etaDomestic: item.listing.etaDomestic || null,
        etaInternational: item.listing.etaInternational || null,
        refundPolicy: item.listing.refundPolicy || null,
        localPricing: item.listing.localPricing || null,
        status: item.listing.status,
        reviewStatus: item.review.status,
        comments: item.review.comments || null,
        rejectionReason: item.review.rejectionReason || null,
        revisionRequests: item.review.revisionRequests ? (item.review.revisionRequests as Record<string, any>) : null,
        createdAt: item.listing.createdAt,
        reviewedAt: item.review.reviewedAt,
        reviewedBy: item.review.reviewedBy,
        sku: item.listing.sku || null,
        slug: item.listing.slug || null,
        metaDescription: item.listing.metaDescription || null,
        barcode: item.listing.barcode || null,
        videoUrl: item.listing.videoUrl || null,
        careInstructions: item.listing.careInstructions || null,
        limitedEditionBadge: item.listing.limitedEditionBadge || null,
        releaseDuration: item.listing.releaseDuration || null,
        additionalTargetAudience: item.listing.additionalTargetAudience || null,
        type: item.listing.type,
        seller: {
          id: item.seller.id,
          brandName: item.brand?.name || item.sellerUser?.name || 'Unknown Seller',
          email: item.sellerBizInfo?.officialEmail || item.sellerUser?.email || null,
          phoneNumber: item.sellerBizInfo?.phoneNumber || null,
          businessAddress: item.sellerBizInfo?.businessAddress || null,
          businessType: item.sellerBizInfo?.businessType || null,
        },
      };

      // Add collection details if it's a collection
      if (item.listing.type === 'collection') {
        responseData.collectionId = item.listing.collectionId;
        responseData.collectionName = collectionName;
        responseData.collectionDescription = collectionDescription;
        responseData.collectionItemCount = collectionProducts?.length || 0;
        // Calculate total price for all items in collection
        if (collectionProducts && collectionProducts.length > 0) {
          responseData.collectionTotalPrice = collectionProducts.reduce((sum: number, product: any) => {
            return sum + (product.priceCents / 100);
          }, 0);
        }
        responseData.collectionProducts = collectionProducts;
      }

      return responseData as any;
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

      // Get seller info for notifications
      const seller = await db.query.sellers.findFirst({
        where: eq(sellers.id, listing.sellerId),
      });

      const sellerUser = seller?.userId
        ? await db.query.users.findFirst({
            where: eq(users.id, seller.userId),
          })
        : null;

      const brand = seller?.brandId
        ? await db.query.brands.findFirst({
            where: eq(brands.id, seller.brandId),
          })
        : null;

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
          reviewedBy: ctx.user?.id,
          reviewedAt: new Date(),
          comments: input.comments,
          updatedAt: new Date(),
        })
        .where(eq(listingReviews.listingId, input.listingId));

      // For collection listings, automatically approve all individual product listings
      if (listing.type === 'collection' && listing.collectionId) {
        try {
          // Get all products in this collection
          const collectionItemsList = await db
            .select()
            .from(collectionItems)
            .where(eq(collectionItems.collectionId, listing.collectionId));

          if (collectionItemsList.length > 0) {
            const productIds = collectionItemsList.map(item => item.productId);
            
            // Get all individual product listings for these products
            const productListings = await db
              .select()
              .from(listings)
              .where(
                and(
                  inArray(listings.productId, productIds),
                  eq(listings.type, 'single')
                )
              );

            if (productListings.length > 0) {
              const productListingIds = productListings.map(l => l.id);
              
              // Approve all individual product listings
              await db
                .update(listings)
                .set({ status: 'approved', updatedAt: new Date() })
                .where(inArray(listings.id, productListingIds));

              // Also update their review status to approved
              await db
                .update(listingReviews)
                .set({
                  status: 'approved',
                  reviewedBy: ctx.user?.id ?? '',
                  reviewedAt: new Date(),
                  comments: `Auto-approved as part of collection approval: ${listing.title}`,
                  updatedAt: new Date(),
                })
                .where(inArray(listingReviews.listingId, productListingIds));

              // Log activity for each approved product
              for (const productListingId of productListingIds) {
                await db.insert(listingActivityLog).values({
                  listingId: productListingId,
                  sellerId: listing.sellerId,
                  action: 'listing_approved',
                  actionType: 'approval',
                  details: {
                    type: 'auto_approved',
                    reason: `Auto-approved as part of collection listing approval`,
                    collectionListingId: input.listingId,
                    collectionId: listing.collectionId,
                  },
                  performedBy: ctx.user?.id,
                  performedByRole: (ctx.user?.role as 'admin' | 'seller' | 'buyer' | undefined),
                });
              }
            }
            
            // Update all products in the collection to mark them as indexed
            await db
              .update(products)
              .set({ updatedAt: new Date() })
              .where(inArray(products.id, productIds));
            
            console.log(
              `Collection listing approved with ${collectionItemsList.length} items and their individual listings auto-approved`,
              { listingId: input.listingId, collectionId: listing.collectionId, productIds, approvedListingCount: productListings.length }
            );
          }
        } catch (error) {
          console.error('Failed to approve collection items:', error);
          // Continue - main collection listing is already approved
        }
      }

      // Log activity
      await db.insert(listingActivityLog).values({
        listingId: input.listingId,
        sellerId: listing.sellerId,
        action: "listing_approved",
        actionType: "approval",
        details: {
          comments: input.comments,
          listingType: listing.type,
          collectionId: listing.collectionId || undefined,
        },
        performedBy: ctx.user?.id,
        performedByRole: (ctx.user?.role as 'admin' | 'seller' | 'buyer' | undefined),
      });

      // Send notifications to seller (email + polling)
      try {
        if (seller && sellerUser) {
          await notifyListingApproved({
            listingId: input.listingId,
            listingTitle: listing.title,
            sellerId: listing.sellerId,
            sellerEmail: sellerUser.email || '',
            sellerName: brand?.name || sellerUser.name || 'Seller',
            comments: input.comments,
          });
        }
      } catch (error) {
        console.error('Failed to send approval notification:', error);
        // Continue even if notification fails - listing is already approved
      }

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

      // Get seller info for notifications
      const seller = await db.query.sellers.findFirst({
        where: eq(sellers.id, listing.sellerId),
      });

      const sellerUser = seller?.userId
        ? await db.query.users.findFirst({
            where: eq(users.id, seller.userId),
          })
        : null;

      const brand = seller?.brandId
        ? await db.query.brands.findFirst({
            where: eq(brands.id, seller.brandId),
          })
        : null;

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
          reviewedBy: ctx.user?.id ?? '',
          reviewedAt: new Date(),
          rejectionReason: input.reason,
          comments: input.comments,
          updatedAt: new Date(),
        })
        .where(eq(listingReviews.listingId, input.listingId));

      // For collection listings, also reject all individual product listings
      if (listing.type === 'collection' && listing.collectionId) {
        try {
          // Get all products in this collection
          const collectionItemsList = await db
            .select()
            .from(collectionItems)
            .where(eq(collectionItems.collectionId, listing.collectionId));

          if (collectionItemsList.length > 0) {
            const productIds = collectionItemsList.map(item => item.productId);
            
            // Get all individual product listings for these products
            const productListings = await db
              .select()
              .from(listings)
              .where(
                and(
                  inArray(listings.productId, productIds),
                  eq(listings.type, 'single')
                )
              );

            if (productListings.length > 0) {
              const productListingIds = productListings.map(l => l.id);
              
              // Reject all individual product listings
              await db
                .update(listings)
                .set({ status: 'rejected', updatedAt: new Date() })
                .where(inArray(listings.id, productListingIds));

              // Also update their review status to rejected
              await db
                .update(listingReviews)
                .set({
                  status: 'rejected',
                  reviewedBy: ctx.user?.id ?? '',
                  reviewedAt: new Date(),
                  rejectionReason: `Auto-rejected due to collection rejection: ${input.reason}`,
                  comments: `Collection was rejected. ${input.comments || ''}`,
                  updatedAt: new Date(),
                })
                .where(inArray(listingReviews.listingId, productListingIds));
            }
          }
        } catch (error) {
          console.error('Failed to reject collection items:', error);
          // Continue - main collection listing is already rejected
        }
      }

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
        performedBy: ctx.user?.id ?? '',
        performedByRole: (ctx.user?.role ?? '') as any,
      });

      // Send notifications to seller (email + polling)
      try {
        if (seller && sellerUser) {
          await notifyListingRejected({
            listingId: input.listingId,
            listingTitle: listing.title,
            sellerId: listing.sellerId,
            sellerEmail: sellerUser.email || '',
            sellerName: brand?.name || sellerUser.name || 'Seller',
            rejectionReason: input.reason,
            comments: input.comments,
          });
        }
      } catch (error) {
        console.error('Failed to send rejection notification:', error);
        // Continue even if notification fails - listing is already rejected
      }

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

      // Get seller info for notifications
      const seller = await db.query.sellers.findFirst({
        where: eq(sellers.id, listing.sellerId),
      });

      const sellerUser = seller?.userId
        ? await db.query.users.findFirst({
            where: eq(users.id, seller.userId),
          })
        : null;

      const brand = seller?.brandId
        ? await db.query.brands.findFirst({
            where: eq(brands.id, seller.brandId),
          })
        : null;

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
          reviewedBy: ctx.user?.id ?? '',
          reviewedAt: new Date(),
          revisionRequests: input.revisionRequests,
          comments: input.comments,
          updatedAt: new Date(),
        })
        .where(eq(listingReviews.listingId, input.listingId));

      // For collection listings, also request revisions for all individual product listings
      if (listing.type === 'collection' && listing.collectionId) {
        try {
          // Get all products in this collection
          const collectionItemsList = await db
            .select()
            .from(collectionItems)
            .where(eq(collectionItems.collectionId, listing.collectionId));

          if (collectionItemsList.length > 0) {
            const productIds = collectionItemsList.map(item => item.productId);
            
            // Get all individual product listings for these products
            const productListings = await db
              .select()
              .from(listings)
              .where(
                and(
                  inArray(listings.productId, productIds),
                  eq(listings.type, 'single')
                )
              );

            if (productListings.length > 0) {
              const productListingIds = productListings.map(l => l.id);
              
              // Update all individual product listings status back to pending_review
              await db
                .update(listings)
                .set({ status: 'pending_review', updatedAt: new Date() })
                .where(inArray(listings.id, productListingIds));

              // Also update their review status to revision_requested
              await db
                .update(listingReviews)
                .set({
                  status: 'revision_requested',
                  reviewedBy: ctx.user?.id ?? '',
                  reviewedAt: new Date(),
                  revisionRequests: input.revisionRequests,
                  comments: `Collection revision requested. ${input.comments || ''}`,
                  updatedAt: new Date(),
                })
                .where(inArray(listingReviews.listingId, productListingIds));
            }
          }
        } catch (error) {
          console.error('Failed to request revisions for collection items:', error);
          // Continue - main collection listing revision request is already created
        }
      }

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
        performedBy: ctx.user?.id ?? '',
        performedByRole: (ctx.user?.role ?? '') as any,
      });

      // Send notifications to seller (email + polling)
      try {
        if (seller && sellerUser) {
          await notifyListingRevisionRequest({
            listingId: input.listingId,
            listingTitle: listing.title,
            sellerId: listing.sellerId,
            sellerEmail: sellerUser.email || '',
            sellerName: brand?.name || sellerUser.name || 'Seller',
            revisionRequests: input.revisionRequests,
            comments: input.comments,
          });
        }
      } catch (error) {
        console.error('Failed to send revision request notification:', error);
        // Continue even if notification fails - revision request is already created
      }

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
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "../trpc/trpc";
import { db } from "../db";
import {
  listings,
  sellers,
  sellerBusiness,
  brands,
  productImages,
  products,
  reviews,
} from "../db/schema";
import {
  and,
  eq,
  desc,
  asc,
  ilike,
  or,
  gte,
  lte,
  sql,
  inArray,
  isNull,
} from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

/**
 * Category filter options
 */
const CategoryEnum = z.enum([
  "men_clothing",
  "women_clothing",
  "men_shoes",
  "women_shoes",
  "accessories",
  "merch",
  "others",
]);

/**
 * Sort options for product discovery
 */
const SortEnum = z.enum(["newest", "price_asc", "price_desc", "popular"]);

/**
 * Output types with proper Date handling
 */
const ProductImageType = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  imageUrl: z.string().url(),
  position: z.number().int(),
});

const SellerInfoType = z.object({
  id: z.string().uuid(),
  brandName: z.string(),
  businessHandle: z.string().nullable(),
  rating: z.number().nullable(),
  totalReviews: z.number().int(),
  responseTime: z.number().int().nullable(),
});

const ListingProductType = z.object({
  id: z.string().uuid(),
  sellerId: z.string().uuid(),
  productId: z.string().uuid().nullable(),
  type: z.enum(["single", "collection"]),
  title: z.string(),
  description: z.string().nullable(),
  category: CategoryEnum.nullable(),
  image: z.string().nullable(),
  imagesJson: z.string().nullable(),
  priceCents: z.number().int().nullable(),
  currency: z.string().nullable(),
  sizesJson: z.string().nullable(),
  supplyCapacity: z.enum(["no_max", "limited"]).nullable(),
  quantityAvailable: z.number().int().nullable(),
  limitedEditionBadge: z.enum(["show_badge", "do_not_show"]).nullable(),
  releaseDuration: z
    .enum(["24hrs", "48hrs", "72hrs", "1week", "2weeks", "1month"])
    .nullable(),
  materialComposition: z.string().nullable(),
  colorsAvailable: z.string().nullable(),
  additionalTargetAudience: z.enum(["male", "female", "unisex"]).nullable(),
  shippingOption: z.enum(["local", "international", "both"]).nullable(),
  etaDomestic: z.string().nullable(),
  etaInternational: z.string().nullable(),
  refund_policy: z.enum(["no_refunds", "48hrs", "72hrs", "5_working_days", "1week", "14days", "30days", "60days", "store_credit"]).nullable(),
  local_pricing: z.enum(["fiat", "cryptocurrency", "both"]).nullable(),
  itemsJson: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  seller: SellerInfoType,
  images: z.array(ProductImageType),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int(),
  viewCount: z.number().int(),
});

const ProductDiscoveryResponseType = z.object({
  products: z.array(ListingProductType),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
  hasMore: z.boolean(),
});

/**
 * Helper to get seller info with computed metrics
 */
async function getSellerInfo(sellerId: string): Promise<z.infer<typeof SellerInfoType>> {
  const seller = await db
    .select()
    .from(sellers)
    .where(eq(sellers.id, sellerId))
    .limit(1);

  if (!seller.length) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Seller not found",
    });
  }

  const sellerRecord = seller[0];

  // Get seller business details
  const businessDetails = await db
    .select()
    .from(sellerBusiness)
    .where(eq(sellerBusiness.sellerId, sellerId))
    .limit(1);
  const business = businessDetails[0];

  // Calculate average rating from reviews via listings
  const ratingResult = await db
    .select({
      avgRating: sql<number>`AVG(${reviews.rating})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(reviews)
    .innerJoin(listings, eq(reviews.listingId, listings.id))
    .where(eq(listings.sellerId, sellerId));

  const rating = ratingResult[0]?.avgRating
    ? parseFloat(ratingResult[0].avgRating.toString())
    : null;
  const reviewCount = ratingResult[0]?.count
    ? parseInt(ratingResult[0].count.toString())
    : 0;

  return {
    id: sellerRecord.id,
    brandName: business?.brandName || "Unknown",
    businessHandle: business?.brandName?.toLowerCase().replace(/\s+/g, '-') || null,
    rating: rating || null,
    totalReviews: reviewCount,
    responseTime: null,
  };
}

/**
 * Helper to get product images
 */
async function getProductImages(
  productId: string
): Promise<z.infer<typeof ProductImageType>[]> {
  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(asc(productImages.position));

  return images.map((img: any) => ({
    id: img.id,
    productId: img.productId,
    imageUrl: img.imageUrl,
    position: img.position,
  }));
}

/**
 * Helper to get product analytics
 */
async function getProductMetrics(listingId: string): Promise<{
  rating: number;
  reviewCount: number;
  viewCount: number;
}> {
  // For now, viewCount is 0 as we don't have a dedicated analytics table yet
  const viewCount = 0;

  // Get reviews and rating
  const reviewsData = await db
    .select({
      avgRating: sql<number>`AVG(${reviews.rating})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(reviews)
    .where(eq(reviews.listingId, listingId));

  const rating = reviewsData[0]?.avgRating
    ? parseFloat(reviewsData[0].avgRating.toString())
    : 0;
  const reviewCount = reviewsData[0]?.count
    ? parseInt(reviewsData[0].count.toString())
    : 0;

  return { rating, reviewCount, viewCount };
}

/**
 * Helper to map listing to ProductType
 */
async function mapListingToProduct(listing: any): Promise<z.infer<typeof ListingProductType>> {
  const sellerInfo = await getSellerInfo(listing.sellerId);
  const images = listing.productId
    ? await getProductImages(listing.productId)
    : [];
  const metrics = await getProductMetrics(listing.id);

  return {
    id: listing.id,
    sellerId: listing.sellerId,
    productId: listing.productId !== undefined ? listing.productId : null,
    type: listing.type as "single" | "collection",
    title: listing.title,
    description: listing.description,
    category: listing.category,
    image: listing.image,
    imagesJson: listing.imagesJson,
    priceCents: listing.priceCents,
    currency: listing.currency,
    sizesJson: listing.sizesJson,
    supplyCapacity: listing.supplyCapacity as "no_max" | "limited" | null,
    quantityAvailable: listing.quantityAvailable,
    limitedEditionBadge: listing.limitedEditionBadge as
      | "show_badge"
      | "do_not_show"
      | null,
    releaseDuration: listing.releaseDuration as
      | "24hrs"
      | "48hrs"
      | "72hrs"
      | "1week"
      | "2weeks"
      | "1month"
      | null,
    materialComposition: listing.materialComposition,
    colorsAvailable: listing.colorsAvailable,
    additionalTargetAudience: listing.additionalTargetAudience as
      | "male"
      | "female"
      | "unisex"
      | null,
    shippingOption: listing.shippingOption as
      | "local"
      | "international"
      | "both"
      | null,
    etaDomestic: listing.etaDomestic,
    etaInternational: listing.etaInternational,
    refund_policy: listing.refundPolicy,
    local_pricing: listing.localPricing,
    itemsJson: listing.itemsJson,
    createdAt: listing.createdAt instanceof Date 
      ? listing.createdAt 
      : new Date(listing.createdAt),
    updatedAt: listing.updatedAt instanceof Date 
      ? listing.updatedAt 
      : new Date(listing.updatedAt),
    seller: sellerInfo,
    images: images,
    rating: Math.round(metrics.rating * 10) / 10,
    reviewCount: metrics.reviewCount,
    viewCount: metrics.viewCount,
  };
}

export const productsRouter = createTRPCRouter({
  /**
   * Discover products with filtering, sorting, and pagination
   * Public endpoint for buyer product discovery
   */
  discover: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().min(1).max(50).default(20),
        category: CategoryEnum.optional(),
        minPrice: z.number().int().nonnegative().optional(),
        maxPrice: z.number().int().nonnegative().optional(),
        search: z.string().optional(),
        sort: SortEnum.default("newest"),
        inStock: z.boolean().optional(),
      })
    )
    .output(ProductDiscoveryResponseType)
    .query(async ({ input }) => {
      const { page, pageSize, category, minPrice, maxPrice, search, sort, inStock } =
        input;

      // Build filters
      const filters: any[] = [
        // Only show single product listings (not collections)
        eq(listings.type, "single"),
      ];

      // Category filter
      if (category) {
        filters.push(eq(listings.category, category));
      }

      // Price filters
      if (minPrice !== undefined) {
        filters.push(gte(listings.priceCents, minPrice));
      }
      if (maxPrice !== undefined) {
        filters.push(lte(listings.priceCents, maxPrice));
      }

      // Search filter (title + description)
      if (search) {
        filters.push(
          or(
            ilike(listings.title, `%${search}%`),
            ilike(listings.description, `%${search}%`)
          )
        );
      }

      // Stock filter
      if (inStock) {
        filters.push(
          sql`(${listings.supplyCapacity} = 'no_max' OR ${listings.quantityAvailable} > 0)`
        );
      }

      // Count total matching products
      const countResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(listings)
        .where(and(...filters));

      const total = countResult[0]?.count
        ? parseInt(countResult[0].count.toString())
        : 0;

      // Determine sort order
      let orderBy: any;
      switch (sort) {
        case "price_asc":
          orderBy = asc(listings.priceCents);
          break;
        case "price_desc":
          orderBy = desc(listings.priceCents);
          break;
        case "popular":
          // Sort by creation date as proxy for popularity
          orderBy = desc(listings.createdAt);
          break;
        case "newest":
        default:
          orderBy = desc(listings.createdAt);
      }

      // Calculate offset
      const offset = (page - 1) * pageSize;

      // Fetch listings
      const listingsData = await db
        .select()
        .from(listings)
        .where(and(...filters))
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(offset);

      // Map to products
      const products = await Promise.all(
        listingsData.map((listing: any) => mapListingToProduct(listing))
      );

      return {
        products,
        total,
        page,
        pageSize,
        hasMore: offset + pageSize < total,
      };
    }),

  /**
   * Get a single product with full details
   */
  getById: publicProcedure
    .input(z.object({ listingId: z.string().uuid() }))
    .output(ListingProductType)
    .query(async ({ input }) => {
      const listing = await db
        .select()
        .from(listings)
        .where(eq(listings.id, input.listingId))
        .limit(1);

      if (!listing.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      return mapListingToProduct(listing[0]);
    }),

  /**
   * Get featured/popular products
   */
  getFeatured: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(20).default(10),
      })
    )
    .output(z.array(ListingProductType))
    .query(async ({ input }) => {
      const listingsData = await db
        .select()
        .from(listings)
        .where(
          eq(listings.type, "single")
        )
        .orderBy(desc(listings.createdAt))
        .limit(input.limit);

      return Promise.all(
        listingsData.map((listing: any) => mapListingToProduct(listing))
      );
    }),

  /**
   * Track product view (protected for authenticated users)
   * Placeholder for future analytics implementation
   */
  trackView: protectedProcedure
    .input(z.object({ listingId: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input }) => {
      try {
        // Verify listing exists
        const listing = await db
          .select()
          .from(listings)
          .where(eq(listings.id, input.listingId))
          .limit(1);

        if (!listing.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }

        // TODO: Implement view tracking with future analytics table
        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error?.message || "Failed to track view",
        });
      }
    }),

  /**
   * Get products by seller
   */
  getBySeller: publicProcedure
    .input(
      z.object({
        sellerId: z.string().uuid(),
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().min(1).max(50).default(20),
        category: CategoryEnum.optional(),
      })
    )
    .output(ProductDiscoveryResponseType)
    .query(async ({ input }) => {
      const { sellerId, page, pageSize, category } = input;

      const filters: any[] = [
        eq(listings.sellerId, sellerId),
        eq(listings.type, "single"),
      ];

      if (category) {
        filters.push(eq(listings.category, category));
      }

      // Count total
      const countResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(listings)
        .where(and(...filters));

      const total = countResult[0]?.count
        ? parseInt(countResult[0].count.toString())
        : 0;

      const offset = (page - 1) * pageSize;

      // Fetch listings
      const listingsData = await db
        .select()
        .from(listings)
        .where(and(...filters))
        .orderBy(desc(listings.createdAt))
        .limit(pageSize)
        .offset(offset);

      // Map to products
      const products = await Promise.all(
        listingsData.map((listing: any) => mapListingToProduct(listing))
      );

      return {
        products,
        total,
        page,
        pageSize,
        hasMore: offset + pageSize < total,
      };
    }),

  /**
   * Get reviews for a specific product
   */
  getProductReviews: publicProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        limit: z.number().int().default(20),
        offset: z.number().int().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        // Handle both productId and listingId cases
        let listingIdToUse = input.productId;
        
        // Check if input is a listing ID or product ID
        const checkListing = await db
          .select({ id: listings.id })
          .from(listings)
          .where(eq(listings.id, input.productId))
          .limit(1);
        
        // If not found as listing ID, try to find listing by productId
        if (checkListing.length === 0) {
          const listingByProduct = await db
            .select({ id: listings.id })
            .from(listings)
            .where(eq(listings.productId, input.productId))
            .limit(1);
          
          if (listingByProduct.length > 0) {
            listingIdToUse = listingByProduct[0].id;
          }
        }
        
        const productReviews = await db
          .select({
            id: reviews.id,
            listingId: reviews.listingId,
            buyerId: reviews.buyerId,
            rating: reviews.rating,
            comment: reviews.comment,
            createdAt: reviews.createdAt,

          })
          .from(reviews)
          .where(eq(reviews.listingId, listingIdToUse))
          .orderBy(desc(reviews.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        // Get average rating
        const ratingResult = await db
          .select({
            avgRating: sql<number>`AVG(CAST(${reviews.rating} as FLOAT))`,
            count: sql<number>`COUNT(*)`,
          })
          .from(reviews)
          .where(eq(reviews.listingId, listingIdToUse));

        const avgRating = ratingResult[0]?.avgRating
          ? parseFloat(ratingResult[0].avgRating.toString())
          : 0;
        const totalReviews = ratingResult[0]?.count
          ? parseInt(ratingResult[0].count.toString())
          : 0;

        return {
          reviews: productReviews,
          averageRating: avgRating,
          totalReviews: totalReviews,
        };
      } catch (error) {
        console.error('[getProductReviews] Error fetching reviews:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch product reviews",
        });
      }
    }),

  /**
   * Create a new product review (protected - requires authentication)
   */
  createProductReview: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        review: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.user || !ctx.user.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Must be logged in to create a review",
          });
        }

        // Find listing by productId
        const listing = await db
          .select()
          .from(listings)
          .where(eq(listings.productId, input.productId))
          .limit(1);

        if (listing.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Listing not found for this product",
          });
        }

        // Create the review
        const newReview = await db
          .insert(reviews)
          .values({
            buyerId: ctx.user.id,
            listingId: listing[0].id,
            rating: input.rating,
            comment: input.review,
          })
          .returning();

        return {
          id: newReview[0].id,
          rating: newReview[0].rating,
          comment: newReview[0].comment,
          createdAt: newReview[0].createdAt,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('[createProductReview] Error creating review:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create review",
        });
      }
    }),
});


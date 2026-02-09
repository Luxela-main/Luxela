import { createTRPCRouter, publicProcedure } from "../trpc/trpc";
import { TRPCError } from "@trpc/server";
import { db } from "../db";
import { brands, listings, sellerBusiness, buyerBrandFollows, reviews, productImages, collectionItems, products, collections } from "../db/schema";
import { eq, desc, asc, countDistinct, count, sql, inArray, and } from "drizzle-orm";
import { z } from "zod";

export const brandsRouter = createTRPCRouter({
  getAllBrands: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/brands",
        tags: ["Brands"],
        summary: "Get all brands with filters and sorting",
      },
    })
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
        search: z.string().optional(),
        sortBy: z
          .enum(["followers", "products", "name", "rating"])
          .default("followers"),
      })
    )
    .output(
      z.object({
        brands: z.array(
          z.object({
            id: z.string().uuid(),
            name: z.string(),
            slug: z.string(),
            description: z.string().nullable(),
            logoImage: z.string().nullable(),
            heroImage: z.string().nullable(),
            rating: z.string(),
            totalProducts: z.number(),
            followersCount: z.number(),
            sellerId: z.string().uuid(),
            // Seller/Store information
            storeLogo: z.string().nullable(),
            storeBanner: z.string().nullable(),
            storeDescription: z.string().nullable(),
            brandName: z.string().nullable(),
          })
        ),
        total: z.number(),
        page: z.number(),
        totalPages: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const offset = (input.page - 1) * input.limit;

        console.log('\n=== getAllBrands Query Started ===');
        console.log('Input:', { page: input.page, limit: input.limit, search: input.search, sortBy: input.sortBy });

        // Build where condition
        const whereCondition = input.search
          ? sql`(${brands.name} ILIKE ${`%${input.search}%`} OR ${brands.description} ILIKE ${`%${input.search}%`})`
          : undefined;

        // Determine sort order based on sortBy parameter
        let orderByClause = desc(brands.totalProducts); // default
        if (input.sortBy === "name") {
          orderByClause = asc(brands.name);
        } else if (input.sortBy === "rating") {
          orderByClause = desc(brands.rating);
        } else if (input.sortBy === "followers") {
          // For followers, we'll need to handle in-memory sorting due to join complexity
          orderByClause = desc(brands.id); // temporary, will re-sort after fetching counts
        } else if (input.sortBy === "products") {
          orderByClause = desc(brands.totalProducts);
        }

        // Get total count first (more efficient)
        console.log('Counting total brands...');
        let countQuery = db
          .select({ count: countDistinct(brands.id) })
          .from(brands);

        if (whereCondition) {
          countQuery = countQuery.where(whereCondition) as any;
        }

        const countResult = await countQuery;
        const total = Number(countResult[0]?.count ?? 0);
        const totalPages = Math.ceil(total / input.limit);
        console.log(`✓ Total brands: ${total}, totalPages: ${totalPages}`);

        // Fetch paginated brands with seller info in single query
        console.log('Fetching paginated brands with seller info...');
        let brandsQuery = db
          .select({
            id: brands.id,
            name: brands.name,
            slug: brands.slug,
            description: brands.description,
            logoImage: brands.logoImage,
            heroImage: brands.heroImage,
            rating: brands.rating,
            sellerId: brands.sellerId,
            storeLogo: sellerBusiness.storeLogo,
            storeBanner: sellerBusiness.storeBanner,
            storeDescription: sellerBusiness.storeDescription,
            brandName: sellerBusiness.brandName,
          })
          .from(brands)
          .leftJoin(sellerBusiness, eq(brands.sellerId, sellerBusiness.sellerId));

        if (whereCondition) {
          brandsQuery = brandsQuery.where(whereCondition) as any;
        }

        const allBrands = await brandsQuery
          .orderBy(orderByClause)
          .limit(input.limit)
          .offset(offset);
        
        console.log(`✓ Fetched ${allBrands.length} brands`);

        // Prepare seller and brand IDs for batch queries
        const sellerIds = Array.from(new Set(allBrands.map(b => b.sellerId))); // deduplicate
        const brandIds = allBrands.map(b => b.id);

        // Execute product and follower count queries in parallel
        console.log(`Fetching counts in parallel for ${allBrands.length} brands...`);
        const [productCountsResult, followerCountsResult] = await Promise.all([
          sellerIds.length > 0 ? db
            .select({ sellerId: listings.sellerId, count: count() })
            .from(listings)
            .where(inArray(listings.sellerId, sellerIds))
            .groupBy(listings.sellerId)
            : Promise.resolve([]),
          brandIds.length > 0 ? db
            .select({
              brandId: buyerBrandFollows.brandId,
              count: count(),
            })
            .from(buyerBrandFollows)
            .where(inArray(buyerBrandFollows.brandId, brandIds))
            .groupBy(buyerBrandFollows.brandId)
            : Promise.resolve([]),
        ]);
        
        const productCountsMap = new Map(
          (productCountsResult || []).map(r => [r.sellerId, Number(r.count ?? 0)])
        );
        const followerCountsMap = new Map(
          (followerCountsResult || []).map(r => [r.brandId, Number(r.count ?? 0)])
        );
        console.log(`✓ Counts fetched (product & follower)`);

        // Build final result
        console.log(`Building final result...`);
        let brandsWithCounts = allBrands.map((item) => {
          const productCount = productCountsMap.get(item.sellerId) ?? 0;
          const followersCount = followerCountsMap.get(item.id) ?? 0;
            
          return {
            id: item.id,
            name: item.name,
            slug: item.slug,
            description: item.description,
            logoImage: item.logoImage || item.storeLogo,
            heroImage: item.heroImage || item.storeBanner,
            rating: item.rating ? String(item.rating) : "0",
            totalProducts: productCount,
            followersCount,
            sellerId: item.sellerId,
            storeLogo: item.storeLogo,
            storeBanner: item.storeBanner,
            storeDescription: item.storeDescription,
            brandName: item.brandName,
          };
        });

        // Handle in-memory sorting for followers (since we need the count which comes from a separate query)
        if (input.sortBy === "followers") {
          brandsWithCounts.sort((a, b) => b.followersCount - a.followersCount);
        }

        const result = {
          brands: brandsWithCounts,
          total,
          page: input.page,
          totalPages,
        };
        
        console.log('=== getAllBrands Query Completed ===\n');
        return result;
      } catch (error: any) {
        console.error("\n!!! ERROR in getAllBrands !!!", {
          message: error?.message || "Unknown error",
          code: error?.code,
          status: error?.status,
          name: error?.name,
          errno: error?.errno,
          sqlState: error?.sqlState,
          stack: error?.stack,
          fullError: JSON.stringify(error, null, 2),
          input,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch brands: ${error?.message || error?.name || "Unknown database error"}`,
          cause: error,
        });
      }
    }),

  getBrandDetails: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/brands/:brandId",
        tags: ["Brands"],
        summary: "Get brand details with products",
      },
    })
    .input(
      z.object({
        brandId: z.string().uuid(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(50).default(20),
      })
    )
    .output(
      z.object({
        brand: z.object({
          id: z.string().uuid(),
          name: z.string(),
          slug: z.string(),
          description: z.string().nullable(),
          logoImage: z.string().nullable(),
          heroImage: z.string().nullable(),
          rating: z.string(),
          totalProducts: z.number(),
          followersCount: z.number(),
          sellerId: z.string().uuid(),
          // Seller/Store information
          storeLogo: z.string().nullable(),
          storeBanner: z.string().nullable(),
          storeDescription: z.string().nullable(),
          brandName: z.string().nullable(),
        }),
        products: z.array(
          z.object({
            id: z.string().uuid(),
            name: z.string(),
            slug: z.string(),
            description: z.string().nullable(),
            image: z.string().nullable(),
            price: z.number(),
            rating: z.number().nullable(),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      try {
        const brandData = await db
          .select({
            id: brands.id,
            name: brands.name,
            slug: brands.slug,
            description: brands.description,
            logoImage: brands.logoImage,
            heroImage: brands.heroImage,
            rating: brands.rating,
            totalProducts: brands.totalProducts,
            sellerId: brands.sellerId,
            storeLogo: sellerBusiness.storeLogo,
            storeBanner: sellerBusiness.storeBanner,
            storeDescription: sellerBusiness.storeDescription,
            brandName: sellerBusiness.brandName,
          })
          .from(brands)
          .leftJoin(sellerBusiness, eq(brands.sellerId, sellerBusiness.sellerId))
          .where(eq(brands.id, input.brandId))
          .limit(1);

        if (!brandData.length) {
          throw new Error("Brand not found");
        }

        const brand = brandData[0];
        const offset = (input.page - 1) * input.limit;

        // Get listings for this brand with pagination
        const brandListings = await db
          .select({
            id: listings.id,
            name: listings.title,
            slug: listings.slug,
            description: listings.description,
            image: listings.image,
            price: listings.priceCents,
          })
          .from(listings)
          .where(eq(listings.sellerId, brand.sellerId))
          .orderBy(desc(listings.createdAt))
          .limit(input.limit)
          .offset(offset);

        // Count total products for this seller
        const totalProductCountResult = await db
          .select({ count: count() })
          .from(listings)
          .where(eq(listings.sellerId, brand.sellerId));

        // Count followers for this brand
        const followersCountResult = await db
          .select({ count: count() })
          .from(buyerBrandFollows)
          .where(eq(buyerBrandFollows.brandId, input.brandId));

        const totalProductCount = Number(totalProductCountResult[0]?.count ?? 0);
        const followersCount = Number(followersCountResult[0]?.count ?? 0);

        return {
          brand: {
            id: brand.id,
            name: brand.name,
            slug: brand.slug,
            description: brand.description,
            logoImage: brand.logoImage || brand.storeLogo,
            heroImage: brand.heroImage || brand.storeBanner,
            rating: brand.rating ? String(brand.rating) : "0",
            totalProducts: totalProductCount,
            followersCount,
            sellerId: brand.sellerId,
            storeLogo: brand.storeLogo,
            storeBanner: brand.storeBanner,
            storeDescription: brand.storeDescription,
            brandName: brand.brandName,
          },
          products: brandListings.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug || p.id,
            description: p.description,
            image: p.image,
            price: (p.price || 0) / 100,
            rating: null,
          })),
        };
      } catch (error: any) {
        // Handle specific error case for brand not found
        if (error?.message === "Brand not found") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Brand not found",
            cause: error,
          });
        }

        console.error("Error fetching brand details:", {
          message: error?.message || "Unknown error",
          code: error?.code,
          stack: error?.stack,
          brandId: input.brandId,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch brand details: ${error?.message || "Unknown database error"}`,
          cause: error,
        });
      }
    }),

  getBrandById: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/brands/by-id/:id",
        tags: ["Brands"],
        summary: "Get brand details by ID",
      },
    })
    .input(
      z.object({
        brandId: z.string().uuid(),
      })
    )
    .output(
      z.object({
        brand: z.object({
          id: z.string().uuid(),
          name: z.string(),
          slug: z.string(),
          description: z.string().nullable(),
          logoImage: z.string().nullable(),
          heroImage: z.string().nullable(),
          rating: z.string(),
          totalProducts: z.number(),
          followersCount: z.number(),
          totalCollections: z.number(),
          reviewsCount: z.number(),
          sellerId: z.string().uuid(),
          storeLogo: z.string().nullable(),
          storeBanner: z.string().nullable(),
          storeDescription: z.string().nullable(),
          brandName: z.string().nullable(),
        }),
      })
    )
    .query(async ({ input }) => {
      try {
        console.log('\n=== getBrandById Query Started ===');
        console.log('Brand ID:', input.brandId);

        const brandData = await db
          .select({
            id: brands.id,
            name: brands.name,
            slug: brands.slug,
            description: brands.description,
            logoImage: brands.logoImage,
            heroImage: brands.heroImage,
            rating: brands.rating,
            sellerId: brands.sellerId,
            storeLogo: sellerBusiness.storeLogo,
            storeBanner: sellerBusiness.storeBanner,
            storeDescription: sellerBusiness.storeDescription,
            brandName: sellerBusiness.brandName,
          })
          .from(brands)
          .leftJoin(sellerBusiness, eq(brands.sellerId, sellerBusiness.sellerId))
          .where(eq(brands.id, input.brandId))
          .limit(1);

        if (!brandData || !brandData.length) {
          console.error(`[getBrandById] Brand not found for ID: "${input.brandId}"`);
          throw new Error(`Brand not found: ${input.brandId}`);
        }

        const brand = brandData[0];
        console.log(`✓ Found brand: ${brand.name} (${brand.id})`);

        const totalProductCountResult = await db
          .select({ count: count() })
          .from(listings)
          .where(eq(listings.sellerId, brand.sellerId));

        const followersCountResult = await db
          .select({ count: count() })
          .from(buyerBrandFollows)
          .where(eq(buyerBrandFollows.brandId, brand.id));

        const totalCollectionsResult = await db
          .select({ count: count() })
          .from(listings)
          .where(and(eq(listings.sellerId, brand.sellerId), eq(listings.type, 'collection')));

        const reviewsCountResult = await db
          .select({ count: count() })
          .from(reviews)
          .innerJoin(listings, eq(reviews.listingId, listings.id))
          .where(eq(listings.sellerId, brand.sellerId));

        const totalProductCount = Number(totalProductCountResult[0]?.count ?? 0);
        const followersCount = Number(followersCountResult[0]?.count ?? 0);
        const totalCollections = Number(totalCollectionsResult[0]?.count ?? 0);
        const reviewsCount = Number(reviewsCountResult[0]?.count ?? 0);

        console.log(`✓ Products: ${totalProductCount}, Followers: ${followersCount}, Collections: ${totalCollections}, Reviews: ${reviewsCount}`);
        console.log('=== getBrandById Query Completed ===\n');

        return {
          brand: {
            id: brand.id,
            name: brand.name,
            slug: brand.slug,
            description: brand.description,
            logoImage: brand.logoImage || brand.storeLogo,
            heroImage: brand.heroImage || brand.storeBanner,
            rating: brand.rating ? String(brand.rating) : "0",
            totalProducts: totalProductCount,
            followersCount,
            totalCollections,
            reviewsCount,
            sellerId: brand.sellerId,
            storeLogo: brand.storeLogo,
            storeBanner: brand.storeBanner,
            storeDescription: brand.storeDescription,
            brandName: brand.brandName,
          },
        };
      } catch (error: any) {
        if (error?.message?.includes("Brand not found")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Brand not found",
            cause: error,
          });
        }

        console.error("Error fetching brand by ID:", {
          message: error?.message || "Unknown error",
          code: error?.code,
          stack: error?.stack,
          brandId: input.brandId,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch brand: ${error?.message || "Unknown database error"}`,
          cause: error,
        });
      }
    }),

  getBrandBySlug: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/brands/by-slug/:slug",
        tags: ["Brands"],
        summary: "Get brand details by slug",
      },
    })
    .input(
      z.object({
        slug: z.string(),
      })
    )
    .output(
      z.object({
        brand: z.object({
          id: z.string().uuid(),
          name: z.string(),
          slug: z.string(),
          description: z.string().nullable(),
          logoImage: z.string().nullable(),
          heroImage: z.string().nullable(),
          rating: z.string(),
          totalProducts: z.number(),
          followersCount: z.number(),
          totalCollections: z.number(),
          reviewsCount: z.number(),
          sellerId: z.string().uuid(),
          // Seller/Store information
          storeLogo: z.string().nullable(),
          storeBanner: z.string().nullable(),
          storeDescription: z.string().nullable(),
          brandName: z.string().nullable(),
        }),
      })
    )
    .query(async ({ input }) => {
      try {
        console.log('\\n=== getBrandBySlug Query Started ===');
        console.log('[getBrandBySlug] Requesting slug:', input.slug);

        const brandData = await db
          .select({
            id: brands.id,
            name: brands.name,
            slug: brands.slug,
            description: brands.description,
            logoImage: brands.logoImage,
            heroImage: brands.heroImage,
            rating: brands.rating,
            sellerId: brands.sellerId,
            storeLogo: sellerBusiness.storeLogo,
            storeBanner: sellerBusiness.storeBanner,
            storeDescription: sellerBusiness.storeDescription,
            brandName: sellerBusiness.brandName,
          })
          .from(brands)
          .leftJoin(sellerBusiness, eq(brands.sellerId, sellerBusiness.sellerId))
          .where(eq(brands.slug, input.slug))
          .limit(1);

        if (!brandData || !brandData.length) {
          console.error(`[getBrandBySlug] Brand not found for slug: "${input.slug}"`);
          throw new Error(`Brand not found: ${input.slug}`);
        }

        const brand = brandData[0];
        console.log(`✓ Found brand: ${brand.name} (${brand.id})`);

        // Count total products for this seller
        const totalProductCountResult = await db
          .select({ count: count() })
          .from(listings)
          .where(eq(listings.sellerId, brand.sellerId));

        // Count followers for this brand
        const followersCountResult = await db
          .select({ count: count() })
          .from(buyerBrandFollows)
          .where(eq(buyerBrandFollows.brandId, brand.id));

        // Count total collections for this brand (collections are listings with type='collection')
        const totalCollectionsResult = await db
          .select({ count: count() })
          .from(listings)
          .where(and(eq(listings.sellerId, brand.sellerId), eq(listings.type, 'collection')));

        // Count total reviews for this brand (reviews are linked to listings)
        // Since listings don't have brandId directly, we need to check through products or collections
        const reviewsCountResult = await db
          .select({ count: count() })
          .from(reviews)
          .innerJoin(listings, eq(reviews.listingId, listings.id))
          .where(eq(listings.sellerId, brand.sellerId));

        const totalProductCount = Number(totalProductCountResult[0]?.count ?? 0);
        const followersCount = Number(followersCountResult[0]?.count ?? 0);
        const totalCollections = Number(totalCollectionsResult[0]?.count ?? 0);
        const reviewsCount = Number(reviewsCountResult[0]?.count ?? 0);

        console.log(`✓ Products: ${totalProductCount}, Followers: ${followersCount}`);
        console.log('=== getBrandBySlug Query Completed ===\\n');

        return {
          brand: {
            id: brand.id,
            name: brand.name,
            slug: brand.slug,
            description: brand.description,
            logoImage: brand.logoImage || brand.storeLogo,
            heroImage: brand.heroImage || brand.storeBanner,
            rating: brand.rating ? String(brand.rating) : "0",
            totalProducts: totalProductCount,
            followersCount,
            totalCollections,
            reviewsCount,
            sellerId: brand.sellerId,
            storeLogo: brand.storeLogo,
            storeBanner: brand.storeBanner,
            storeDescription: brand.storeDescription,
            brandName: brand.brandName,
          },
        };
      } catch (error: any) {
        // Handle specific error case for brand not found
        if (error?.message?.includes("Brand not found")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Brand "${input.slug}" not found`,
            cause: error,
          });
        }

        console.error("Error fetching brand by slug:", {
          message: error?.message || "Unknown error",
          code: error?.code,
          stack: error?.stack,
          slug: input.slug,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch brand: ${error?.message || "Unknown database error"}`,
          cause: error,
        });
      }
    }),

  // Get approved listings for a specific brand
  getBrandListings: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/brands/:brandId/listings",
        tags: ["Brands"],
        summary: "Get approved listings for a specific brand",
      },
    })
    .input(
      z.object({
        brandId: z.string().uuid(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
      })
    )
    .output(
      z.object({
        listings: z.array(
          z.object({
            id: z.string().uuid(),
            title: z.string(),
            description: z.string().nullable(),
            image: z.string().nullable(),
            imagesJson: z.string().nullable(),
            price: z.number(),
            price_cents: z.number(),
            currency: z.string(),
            category: z.string().nullable(),
            type: z.enum(["single", "collection"]),
            quantity_available: z.number(),
            seller_id: z.string().uuid(),
            created_at: z.date(),
            updated_at: z.date(),
            slug: z.string().nullable(),
            sku: z.string().nullable(),
            status: z.string(),
            barcode: z.string().nullable().optional(),
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
            videoUrl: z.string().nullable().optional(),
            careInstructions: z.string().nullable().optional(),
            limitedEditionBadge: z.string().nullable().optional(),
            releaseDuration: z.string().nullable().optional(),
            additionalTargetAudience: z.string().nullable().optional(),
            metaDescription: z.string().nullable().optional(),
            // Collection-specific fields
            collectionItemCount: z.number().optional(),
            collectionTotalPrice: z.number().optional(),
            collectionProducts: z.array(z.object({
              id: z.string().uuid(),
              title: z.string(),
              description: z.string().nullable(),
              price: z.number(),
              price_cents: z.number(),
              images: z.array(z.string()),
              colors: z.any().nullable(),
              sizes: z.any().nullable(),
              material: z.string().nullable(),
              careInstructions: z.string().nullable(),
            })).optional(),
          })
        ),
        total: z.number(),
        page: z.number(),
        totalPages: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        console.log("=== getBrandListings Query Started ===");
        console.log("Brand ID:", input.brandId);

        // First verify the brand exists
        const brandExists = await db
          .select({ id: brands.id, sellerId: brands.sellerId })
          .from(brands)
          .where(eq(brands.id, input.brandId))
          .limit(1);

        if (!brandExists.length) {
          console.log(`Brand not found: ${input.brandId}`);
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Brand not found",
          });
        }

        const brand = brandExists[0];
        const offset = (input.page - 1) * input.limit;

        console.log(`[getBrandListings] Brand found:`, { id: brand.id, sellerId: brand.sellerId });
        console.log(`[getBrandListings] Fetching products for brand ${brand.id}`);

        // First get all products for this brand
        // Count total approved listings for ALL products from this seller
        const countResult = await db
          .select({ count: count() })
          .from(listings)
          .where(and(
            eq(listings.sellerId, brand.sellerId),
            // Only show approved listings to buyers
            eq(listings.status, 'approved')
          ));

        const total = Number(countResult[0]?.count ?? 0);
        console.log(`[getBrandListings] Total listings (approved) from seller: ${total}`);

        // Fetch approved listings for ALL products from this seller
        console.log(`[getBrandListings] Fetching listings with offset ${offset}, limit ${input.limit}`);
        const brandListings = await db
            .select({
              id: listings.id,
            title: listings.title,
            description: listings.description,
            image: listings.image,
            price_cents: listings.priceCents,
            currency: listings.currency,
            category: listings.category,
            type: listings.type,
            quantity_available: listings.quantityAvailable,
            seller_id: listings.sellerId,
            created_at: listings.createdAt,
            updated_at: listings.updatedAt,
            slug: listings.slug,
            sku: listings.sku,
            status: listings.status,
            barcode: listings.barcode,
            supplyCapacity: listings.supplyCapacity,
            imagesJson: listings.imagesJson,
            colorsAvailable: listings.colorsAvailable,
            sizes: listings.sizesJson,
            materialComposition: listings.materialComposition,
            shippingOption: listings.shippingOption,
            etaDomestic: listings.etaDomestic,
            etaInternational: listings.etaInternational,
            refundPolicy: listings.refundPolicy,
            localPricing: listings.localPricing,
            videoUrl: listings.videoUrl,
            careInstructions: listings.careInstructions,
            limitedEditionBadge: listings.limitedEditionBadge,
            releaseDuration: listings.releaseDuration,
            additionalTargetAudience: listings.additionalTargetAudience,
            metaDescription: listings.metaDescription,
            productId: listings.productId,
          })
            .from(listings)
            .where(and(
              eq(listings.sellerId, brand.sellerId),
              // Only show approved listings to buyers
              eq(listings.status, 'approved')
            ))
            .orderBy(desc(listings.createdAt))
            .limit(input.limit)
            .offset(offset);
          console.log(`[getBrandListings] Fetched ${brandListings.length} listings`);
          
          // Apply null coalescing for fields that can be nullable
          const coalescedListings = brandListings.map(l => ({
            ...l,
            price_cents: l.price_cents ?? 0,
            currency: l.currency ?? 'NGN',
            category: l.category ?? 'general',
            quantity_available: l.quantity_available ?? 0,
          }));

        console.log(`[getBrandListings] Processing ${coalescedListings.length} listings for enrichment`);

        // Enrich listings with product images and parsed data (only if there are listings)
        const enrichedListings = await Promise.all(
          brandListings.map(async (listing) => {
            // Check if this is a collection
            const isCollection = listing.type === 'collection';
            let collectionItemCount = 0;
            let collectionTotalPrice = 0;
            let collectionProductsList: any[] = [];
            let allCollectionImages: string[] = [];

            if (isCollection && listing.id) {
              // Fetch collection items
              const collectionItemsList = await db
                .select()
                .from(collectionItems)
                .where(eq(collectionItems.collectionId, listing.id))
                .orderBy(collectionItems.position);

              collectionItemCount = collectionItemsList.length;

              if (collectionItemsList.length > 0) {
                const productIds = collectionItemsList.map((item) => item.productId);
                
                // Fetch all products in collection
                const productsInCollection = await db
                  .select()
                  .from(products)
                  .where(inArray(products.id, productIds));

                // Fetch all product listings to get pricing and details
                const productListings = await db
                  .select()
                  .from(listings)
                  .where(inArray(listings.productId, productIds));

                // Fetch all images for collection products
                const allProductImages = await db
                  .select()
                  .from(productImages)
                  .where(inArray(productImages.productId, productIds))
                  .orderBy(productImages.position);

                // Build product data with pricing
                collectionProductsList = collectionItemsList
                  .map((collectionItem) => {
                    const product = productsInCollection.find((p) => p.id === collectionItem.productId);
                    const productListing = productListings.find((l) => l.productId === collectionItem.productId);
                    const productImages = allProductImages.filter((img) => img.productId === collectionItem.productId);

                    if (!product) return null;

                    const price = productListing?.priceCents ? productListing.priceCents / 100 : (product.priceCents ? product.priceCents / 100 : 0);
                    collectionTotalPrice += price;

                    // Collect all images for collection
                    productImages.forEach((img) => {
                      if (img.imageUrl && !allCollectionImages.includes(img.imageUrl)) {
                        allCollectionImages.push(img.imageUrl);
                      }
                    });

                    let colors = null;
                    let sizes = null;
                    if (productListing?.colorsAvailable) {
                      try {
                        colors = JSON.parse(productListing.colorsAvailable);
                      } catch (e) {
                        // Silently fail
                      }
                    }
                    if (productListing?.sizesJson) {
                      try {
                        sizes = JSON.parse(productListing.sizesJson);
                      } catch (e) {
                        // Silently fail
                      }
                    }

                    return {
                      id: product.id,
                      title: product.name,
                      description: product.description,
                      price,
                      price_cents: productListing?.priceCents ?? product.priceCents ?? 0,
                      images: productImages.map((img) => img.imageUrl),
                      colors,
                      sizes,
                      material: productListing?.materialComposition || null,
                      careInstructions: productListing?.careInstructions || null,
                    };
                  })
                  .filter((p) => p !== null);
              }
            }

            // Fetch images from productImages table if available (for single listings or collection cover image)
            let listingImages: any[] = [];
            if (listing.productId) {
              listingImages = await db
                .select()
                .from(productImages)
                .where(eq(productImages.productId, listing.productId))
                .orderBy(productImages.position);
            }

            // Fallback to parsing imagesJson if no productImages found
            if (listingImages.length === 0 && listing.imagesJson) {
              try {
                const parsedImages = JSON.parse(listing.imagesJson);
                if (Array.isArray(parsedImages)) {
                  listingImages = parsedImages.map((img: any, index: number) => ({
                    imageUrl: typeof img === 'string' ? img : img.imageUrl || img.url,
                    position: index,
                  }));
                }
              } catch (e) {
                console.warn('[getBrandListings] Failed to parse imagesJson for listing:', listing.id);
              }
            }

            // Extract URLs and ensure primary image is included
            let imageUrls = listingImages
              .map((img) => img.imageUrl || img.url || (typeof img === 'string' ? img : ''))
              .filter((url) => url && typeof url === 'string' && url.trim() !== '');

            // For collections, include all product images
            if (isCollection && allCollectionImages.length > 0) {
              imageUrls = [...new Set([...imageUrls, ...allCollectionImages])];
            }

            if (imageUrls.length === 0 && listing.image) {
              imageUrls = [listing.image];
            }

            // Parse colors and sizes
            let colors = null;
            let sizes = null;
            
            if (listing.colorsAvailable) {
              try {
                colors = JSON.parse(listing.colorsAvailable);
              } catch (e) {
                console.warn('[getBrandListings] Failed to parse colors for listing:', listing.id);
              }
            }

            if (listing.sizes) {
              try {
                sizes = JSON.parse(listing.sizes);
              } catch (e) {
                console.warn('[getBrandListings] Failed to parse sizes for listing:', listing.id);
              }
            }

            // Build price - for collections use the calculated total
            const price = isCollection ? collectionTotalPrice : (listing.price_cents ? listing.price_cents / 100 : 0);

            return {
              id: listing.id,
              title: listing.title,
              description: listing.description,
              image: listing.image,
              imagesJson: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
              price,
              price_cents: listing.price_cents || 0,
              currency: listing.currency || 'NGN',
              category: listing.category || 'general',
              type: listing.type,
              quantity_available: listing.quantity_available || 0,
              seller_id: listing.seller_id,
              created_at: listing.created_at,
              updated_at: listing.updated_at,
              slug: listing.slug,
              sku: listing.sku,
              status: listing.status,
              barcode: listing.barcode,
              supplyCapacity: listing.supplyCapacity,
              colors: colors,
              sizes: sizes,
              materialComposition: listing.materialComposition,
              shippingOption: listing.shippingOption,
              etaDomestic: listing.etaDomestic,
              etaInternational: listing.etaInternational,
              refundPolicy: listing.refundPolicy,
              localPricing: listing.localPricing,
              videoUrl: listing.videoUrl,
              careInstructions: listing.careInstructions,
              limitedEditionBadge: listing.limitedEditionBadge,
              releaseDuration: listing.releaseDuration,
              additionalTargetAudience: listing.additionalTargetAudience,
              metaDescription: listing.metaDescription,
              ...(isCollection ? {
                collectionItemCount,
                collectionTotalPrice,
                collectionProducts: collectionProductsList,
              } : {}),
            };
          })
        );

        const totalPages = Math.ceil(total / input.limit);

        console.log(`✓ Found ${enrichedListings.length} listings for brand with complete details`);
        console.log("=== getBrandListings Query Completed ===");

        return {
          listings: enrichedListings,
          total,
          page: input.page,
          totalPages,
        };
      } catch (error: any) {
        if (error.code === "NOT_FOUND") {
          throw error;
        }

        console.error("Error fetching brand listings:", {
          message: error?.message || "Unknown error",
          code: error?.code,
          brandId: input.brandId,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch brand listings",
          cause: error,
        });
      }
    }),

  // Get all seller's brands with their products from listings
  getSellerBrandsWithProducts: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/brands/seller/:sellerId/with-products",
        tags: ["Brands"],
        summary: "Get seller's brands with their products from listings",
      },
    })
    .input(
      z.object({
        sellerId: z.string().uuid(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
      })
    )
    .output(
      z.object({
        brands: z.array(
          z.object({
            id: z.string().uuid(),
            name: z.string(),
            slug: z.string(),
            description: z.string().nullable(),
            logoImage: z.string().nullable(),
            heroImage: z.string().nullable(),
            rating: z.string(),
            followersCount: z.number(),
            products: z.array(
              z.object({
                id: z.string().uuid(),
                title: z.string(),
                description: z.string().nullable(),
                image: z.string().nullable(),
                imagesJson: z.string().nullable(),
                price: z.number(),
                price_cents: z.number(),
                currency: z.string(),
                category: z.string().nullable(),
                type: z.enum(["single", "collection"]),
                quantity_available: z.number(),
                seller_id: z.string().uuid(),
                created_at: z.date(),
                updated_at: z.date(),
                slug: z.string().nullable(),
                sku: z.string().nullable(),
                status: z.string(),
                barcode: z.string().nullable().optional(),
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
                videoUrl: z.string().nullable().optional(),
                careInstructions: z.string().nullable().optional(),
                limitedEditionBadge: z.string().nullable().optional(),
                releaseDuration: z.string().nullable().optional(),
              })
            ),
          })
        ),
        total: z.number(),
        page: z.number(),
        totalPages: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        console.log("\n=== getSellerBrandsWithProducts Query Started ===");
        console.log("Seller ID:", input.sellerId);

        // Fetch all brands for this seller
        const sellerBrands = await db
          .select({
            id: brands.id,
            name: brands.name,
            slug: brands.slug,
            description: brands.description,
            logoImage: brands.logoImage,
            heroImage: brands.heroImage,
            rating: brands.rating,
            sellerId: brands.sellerId,
          })
          .from(brands)
          .where(eq(brands.sellerId, input.sellerId));

        console.log(`Found ${sellerBrands.length} brands for seller ${input.sellerId}`);

        if (sellerBrands.length === 0) {
          return {
            brands: [],
            total: 0,
            page: input.page,
            totalPages: 0,
          };
        }

        const brandIds = sellerBrands.map(b => b.id);

        // Fetch all products for these brands
        const brandProducts = await db
          .select({ id: products.id, brandId: products.brandId })
          .from(products)
          .where(inArray(products.brandId, brandIds));

        const brandProductIds = brandProducts.map(p => p.id);
        console.log(`Found ${brandProductIds.length} products for seller's brands`);

        // Fetch listings for these products (approved and pending_review only)
        const productListings = await db
          .select({
            id: listings.id,
            title: listings.title,
            description: listings.description,
            image: listings.image,
            price_cents: listings.priceCents,
            currency: listings.currency,
            category: listings.category,
            type: listings.type,
            quantity_available: listings.quantityAvailable,
            seller_id: listings.sellerId,
            created_at: listings.createdAt,
            updated_at: listings.updatedAt,
            slug: listings.slug,
            sku: listings.sku,
            status: listings.status,
            barcode: listings.barcode,
            supplyCapacity: listings.supplyCapacity,
            imagesJson: listings.imagesJson,
            colorsAvailable: listings.colorsAvailable,
            sizes: listings.sizesJson,
            materialComposition: listings.materialComposition,
            shippingOption: listings.shippingOption,
            etaDomestic: listings.etaDomestic,
            etaInternational: listings.etaInternational,
            refundPolicy: listings.refundPolicy,
            localPricing: listings.localPricing,
            videoUrl: listings.videoUrl,
            careInstructions: listings.careInstructions,
            limitedEditionBadge: listings.limitedEditionBadge,
            releaseDuration: listings.releaseDuration,
            additionalTargetAudience: listings.additionalTargetAudience,
            metaDescription: listings.metaDescription,
            productId: listings.productId,
          })
          .from(listings)
          .where(and(
            eq(listings.sellerId, input.sellerId),
            inArray(listings.status, ['approved', 'pending_review'])
          ))
          .orderBy(desc(listings.createdAt));

        console.log(`Found ${productListings.length} listings for seller (approved + pending)`);

        // Fetch all images for these listings
        // Get productIds from listings to fetch their images
        const productIds = productListings.map(l => l.productId).filter((id): id is string => id !== null && id !== undefined);
        const listingImages = await db
          .select({
            productId: productImages.productId,
            imageUrl: productImages.imageUrl,
            position: productImages.position,
          })
          .from(productImages)
          .where(productIds.length > 0 ? inArray(productImages.productId, productIds) : sql`false`)
          .orderBy(asc(productImages.position));

        // Count followers for each brand
        const followersData = await db
          .select({
            brandId: buyerBrandFollows.brandId,
            count: count(),
          })
          .from(buyerBrandFollows)
          .where(inArray(buyerBrandFollows.brandId, brandIds))
          .groupBy(buyerBrandFollows.brandId);

        const followersMap = new Map(
          followersData.map(f => [f.brandId, f.count])
        );

        // Build the response by enriching brands with their products
        const enrichedBrands = sellerBrands.map(brand => {
          // Get all listings for this brand's products
          const brandProductIds = brandProducts
            .filter(p => p.brandId === brand.id)
            .map(p => p.id);

          const brandListings = productListings.filter(l =>
            l.productId ? brandProductIds.includes(l.productId) : false
          );

          // Enrich listings with images
          const enrichedListings = brandListings.map(listing => {
            const listingImageUrls = listingImages
              .filter(img => img.productId === listing.productId)
              .sort((a, b) => a.position - b.position)
              .map(img => img.imageUrl);

            // Parse colors
            let colors = null;
            try {
              if (listing.colorsAvailable) {
                colors = JSON.parse(listing.colorsAvailable);
              }
            } catch (e) {
              colors = null;
            }

            // Parse sizes
            let sizes = null;
            try {
              if (listing.sizes) {
                sizes = JSON.parse(listing.sizes);
              }
            } catch (e) {
              sizes = null;
            }

            return {
              id: listing.id,
              title: listing.title,
              description: listing.description,
              image: listing.image,
              imagesJson: listingImageUrls.length > 0 ? JSON.stringify(listingImageUrls) : listing.imagesJson,
              price: (listing.price_cents ?? 0) / 100,
              price_cents: listing.price_cents ?? 0,
              currency: listing.currency ?? 'NGN',
              category: listing.category,
              type: listing.type,
              quantity_available: listing.quantity_available,
              seller_id: listing.seller_id,
              created_at: listing.created_at,
              updated_at: listing.updated_at,
              slug: listing.slug,
              sku: listing.sku,
              status: listing.status,
              barcode: listing.barcode,
              supplyCapacity: listing.supplyCapacity,
              sizes,
              colors,
              materialComposition: listing.materialComposition,
              shippingOption: listing.shippingOption,
              etaDomestic: listing.etaDomestic,
              etaInternational: listing.etaInternational,
              refundPolicy: listing.refundPolicy,
              localPricing: listing.localPricing,
              videoUrl: listing.videoUrl,
              careInstructions: listing.careInstructions,
              limitedEditionBadge: listing.limitedEditionBadge,
              releaseDuration: listing.releaseDuration,
            };
          });

          return {
            id: brand.id,
            name: brand.name,
            slug: brand.slug,
            description: brand.description,
            logoImage: brand.logoImage,
            heroImage: brand.heroImage,
            rating: brand.rating ? String(brand.rating) : "0",
            followersCount: followersMap.get(brand.id) || 0,
            products: enrichedListings,
          };
        });

        console.log(`✓ Enriched ${enrichedBrands.length} brands with products`);
        console.log("=== getSellerBrandsWithProducts Query Completed ===");

        return {
          brands: enrichedBrands,
          total: enrichedBrands.length,
          page: input.page,
          totalPages: 1,
        };
      } catch (error: any) {
        console.error("Error fetching seller brands with products:", {
          message: error?.message || "Unknown error",
          code: error?.code,
          sellerId: input.sellerId,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch seller brands with products",
          cause: error,
        });
      }
    }),
});
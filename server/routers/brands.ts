import { createTRPCRouter, publicProcedure } from "../trpc/trpc";
import { TRPCError } from "@trpc/server";
import { db } from "../db";
import {
  brands,
  listings,
  sellerBusiness,
  buyerBrandFollows,
  reviews,
  productImages,
  collectionItems,
  products,
  collections,
} from "../db/schema";
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

        console.log("=== getAllBrands Query Started ===");
        console.log("Input:", {
          page: input.page,
          limit: input.limit,
          search: input.search,
          sortBy: input.sortBy,
        });

        // Build where condition
        const whereCondition = input.search
          ? sql`(${brands.name} ILIKE ${`%${input.search}%`} OR ${brands.description} ILIKE ${`%${input.search}%`})`
          : undefined;

        // Get total count first
        console.log("Counting total brands...");
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

        // Determine sort order
        let orderByClause = desc(brands.totalProducts);
        if (input.sortBy === "name") {
          orderByClause = asc(brands.name);
        } else if (input.sortBy === "rating") {
          orderByClause = desc(brands.rating);
        }

        // Fetch paginated brands (without expensive join)
        console.log("Fetching paginated brands...");
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
          })
          .from(brands);

        if (whereCondition) {
          brandsQuery = brandsQuery.where(whereCondition) as any;
        }

        const allBrands = await brandsQuery
          .orderBy(orderByClause)
          .limit(input.limit)
          .offset(offset);

        console.log(`✓ Fetched ${allBrands.length} brands`);

        // Prepare IDs for batch queries
        const sellerIds: string[] = Array.from(
          new Set(allBrands.map((b: any) => b.sellerId))
        ) as string[];
        const brandIds: string[] = allBrands.map((b: any) => b.id) as string[];

        // Execute product and follower count queries IN PARALLEL (optimization!)
        console.log(`Fetching counts for ${allBrands.length} brands...`);

        const [productCountsResult, followerCountsResult, sellerDataResult] = await Promise.all([
          db
            .select({ sellerId: listings.sellerId, count: count() })
            .from(listings)
            .where(
              and(
                inArray(listings.sellerId, sellerIds),
                eq(listings.status, "approved")
              )
            )
            .groupBy(listings.sellerId),
          db
            .select({
              brandId: buyerBrandFollows.brandId,
              count: count(),
            })
            .from(buyerBrandFollows)
            .where(inArray(buyerBrandFollows.brandId, brandIds))
            .groupBy(buyerBrandFollows.brandId),
          db
            .select({
              sellerId: sellerBusiness.sellerId,
              storeLogo: sellerBusiness.storeLogo,
              storeBanner: sellerBusiness.storeBanner,
              storeDescription: sellerBusiness.storeDescription,
              brandName: sellerBusiness.brandName,
            })
            .from(sellerBusiness)
            .where(inArray(sellerBusiness.sellerId, sellerIds)),
        ]);

        console.log(`✓ Product and follower counts fetched in parallel`);

        const productCountsMap = new Map(
          (productCountsResult || []).map((r: any) => [
            r.sellerId,
            Number(r.count ?? 0),
          ])
        );
        const followerCountsMap = new Map(
          (followerCountsResult || []).map((r: any) => [
            r.brandId,
            Number(r.count ?? 0),
          ])
        );
        const sellerDataMap = new Map(
          (sellerDataResult || []).map((r: any) => [
            r.sellerId,
            r,
          ])
        );

        console.log(`Building final result...`);
        let brandsWithCounts = allBrands.map((item: any) => {
          const productCount = productCountsMap.get(item.sellerId) ?? 0;
          const followersCount = followerCountsMap.get(item.id) ?? 0;
          const sellerData = sellerDataMap.get(item.sellerId) || {};

          return {
            id: item.id,
            name: item.name,
            slug: item.slug,
            description: item.description,
            logoImage: item.logoImage || sellerData.storeLogo,
            heroImage: item.heroImage || sellerData.storeBanner,
            rating: item.rating ? String(item.rating) : "0",
            totalProducts: productCount,
            followersCount,
            sellerId: item.sellerId,
            storeLogo: sellerData.storeLogo,
            storeBanner: sellerData.storeBanner,
            storeDescription: sellerData.storeDescription,
            brandName: sellerData.brandName,
          };
        });

        // Sort in-memory only for followers (needs the count from separate query)
        if (input.sortBy === "followers") {
          brandsWithCounts.sort(
            (a: any, b: any) => b.followersCount - a.followersCount
          );
        }

        const result = {
          brands: brandsWithCounts,
          total,
          page: input.page,
          totalPages,
        };

        console.log("=== getAllBrands Query Completed ===\n");
        return result;
      } catch (error: any) {
        console.error("!!! ERROR in getAllBrands !!!", {
          message: error?.message || "Unknown error",
          code: error?.code,
          status: error?.status,
          stack: error?.stack,
          input,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch brands: ${
            error?.message || error?.name || "Unknown database error"
          }`,
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
        sellerId: z.string().uuid().optional(),
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
        console.log("=== getBrandBySlug Query Started ===");
        console.log("Brand slug:", input.slug);
        console.log("SellerId filter:", input.sellerId);

        // Build where condition - filter by slug and optionally by sellerId
        const whereConditions = input.sellerId
          ? and(eq(brands.slug, input.slug), eq(brands.sellerId, input.sellerId))
          : eq(brands.slug, input.slug);

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
          .leftJoin(
            sellerBusiness,
            eq(brands.sellerId, sellerBusiness.sellerId)
          )
          .where(whereConditions)
          .limit(1);

        if (!brandData || !brandData.length) {
          console.error(`[getBrandBySlug] Brand not found for slug: "${input.slug}"`);
          throw new Error(`Brand not found: ${input.slug}`);
        }

        const brand = brandData[0];
        console.log(`✓ Found brand: ${brand.name} (${brand.id})`);

        // OPTIMIZATION: Execute all counts in parallel instead of sequentially
        const [
          totalProductCountResult,
          followersCountResult,
          totalCollectionsResult,
          reviewsCountResult,
        ] = await Promise.all([
          db
            .select({ count: count() })
            .from(listings)
            .where(eq(listings.sellerId, brand.sellerId)),
          db
            .select({ count: count() })
            .from(buyerBrandFollows)
            .where(eq(buyerBrandFollows.brandId, brand.id)),
          db
            .select({ count: count() })
            .from(listings)
            .where(
              and(
                eq(listings.sellerId, brand.sellerId),
                eq(listings.type, "collection")
              )
            ),
          db
            .select({ count: count() })
            .from(reviews)
            .innerJoin(listings, eq(reviews.listingId, listings.id))
            .where(eq(listings.sellerId, brand.sellerId)),
        ]);

        const totalProductCount = Number(totalProductCountResult[0]?.count ?? 0);
        const followersCount = Number(followersCountResult[0]?.count ?? 0);
        const totalCollections = Number(totalCollectionsResult[0]?.count ?? 0);
        const reviewsCount = Number(reviewsCountResult[0]?.count ?? 0);

        console.log(
          `✓ Products: ${totalProductCount}, Followers: ${followersCount}, Collections: ${totalCollections}, Reviews: ${reviewsCount}`
        );
        console.log("=== getBrandBySlug Query Completed ===\n");

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

        console.error("Error fetching brand by slug:", {
          message: error?.message || "Unknown error",
          code: error?.code,
          stack: error?.stack,
          slug: input.slug,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch brand: ${
            error?.message || "Unknown database error"
          }`,
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
        console.log("=== getBrandById Query Started ===");
        console.log("Brand ID:", input.brandId);

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
          .leftJoin(
            sellerBusiness,
            eq(brands.sellerId, sellerBusiness.sellerId)
          )
          .where(eq(brands.id, input.brandId))
          .limit(1);

        if (!brandData || !brandData.length) {
          console.error(`[getBrandById] Brand not found for ID: "${input.brandId}"`);
          throw new Error(`Brand not found: ${input.brandId}`);
        }

        const brand = brandData[0];
        console.log(`✓ Found brand: ${brand.name} (${brand.id})`);

        // OPTIMIZATION: Execute all counts in parallel instead of sequentially
        const [
          totalProductCountResult,
          followersCountResult,
          totalCollectionsResult,
          reviewsCountResult,
        ] = await Promise.all([
          db
            .select({ count: count() })
            .from(listings)
            .where(eq(listings.sellerId, brand.sellerId)),
          db
            .select({ count: count() })
            .from(buyerBrandFollows)
            .where(eq(buyerBrandFollows.brandId, brand.id)),
          db
            .select({ count: count() })
            .from(listings)
            .where(
              and(
                eq(listings.sellerId, brand.sellerId),
                eq(listings.type, "collection")
              )
            ),
          db
            .select({ count: count() })
            .from(reviews)
            .innerJoin(listings, eq(reviews.listingId, listings.id))
            .where(eq(listings.sellerId, brand.sellerId)),
        ]);

        const totalProductCount = Number(totalProductCountResult[0]?.count ?? 0);
        const followersCount = Number(followersCountResult[0]?.count ?? 0);
        const totalCollections = Number(totalCollectionsResult[0]?.count ?? 0);
        const reviewsCount = Number(reviewsCountResult[0]?.count ?? 0);

        console.log(
          `✓ Products: ${totalProductCount}, Followers: ${followersCount}, Collections: ${totalCollections}, Reviews: ${reviewsCount}`
        );
        console.log("=== getBrandById Query Completed ===\n");

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
          message: `Failed to fetch brand: ${
            error?.message || "Unknown database error"
          }`,
          cause: error,
        });
      }
    }),

  getBrandBySellerId: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/brands/by-seller/:sellerId",
        tags: ["Brands"],
        summary: "Get brand details by seller ID (fallback lookup)",
      },
    })
    .input(
      z.object({
        sellerId: z.string().uuid(),
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
        console.log("=== getBrandBySellerId Query Started ===");
        console.log("Seller ID:", input.sellerId);

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
          .leftJoin(
            sellerBusiness,
            eq(brands.sellerId, sellerBusiness.sellerId)
          )
          .where(eq(brands.sellerId, input.sellerId))
          .limit(1);

        if (!brandData || !brandData.length) {
          console.error(`[getBrandBySellerId] Brand not found for seller: "${input.sellerId}"`);
          throw new Error(`Brand not found for seller: ${input.sellerId}`);
        }

        const brand = brandData[0];
        console.log(`✓ Found brand: ${brand.name} (${brand.id})`);

        const [
          totalProductCountResult,
          followersCountResult,
          totalCollectionsResult,
          reviewsCountResult,
        ] = await Promise.all([
          db
            .select({ count: count() })
            .from(listings)
            .where(eq(listings.sellerId, brand.sellerId)),
          db
            .select({ count: count() })
            .from(buyerBrandFollows)
            .where(eq(buyerBrandFollows.brandId, brand.id)),
          db
            .select({ count: count() })
            .from(listings)
            .where(
              and(
                eq(listings.sellerId, brand.sellerId),
                eq(listings.type, "collection")
              )
            ),
          db
            .select({ count: count() })
            .from(reviews)
            .innerJoin(listings, eq(reviews.listingId, listings.id))
            .where(eq(listings.sellerId, brand.sellerId)),
        ]);

        const totalProductCount = Number(totalProductCountResult[0]?.count ?? 0);
        const followersCount = Number(followersCountResult[0]?.count ?? 0);
        const totalCollections = Number(totalCollectionsResult[0]?.count ?? 0);
        const reviewsCount = Number(reviewsCountResult[0]?.count ?? 0);

        console.log(
          `✓ Products: ${totalProductCount}, Followers: ${followersCount}, Collections: ${totalCollections}, Reviews: ${reviewsCount}`
        );
        console.log("=== getBrandBySellerId Query Completed ===\n");

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

        console.error("Error fetching brand by seller ID:", {
          message: error?.message || "Unknown error",
          code: error?.code,
          stack: error?.stack,
          sellerId: input.sellerId,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch brand: ${error?.message || "Unknown database error"}`,
          cause: error,
        });
      }
    }),

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
        listings: z.array(z.any()),
        total: z.number(),
        page: z.number(),
        totalPages: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        console.log("=== getBrandListings Query Started ===");
        console.log("Brand ID:", input.brandId);

        // Verify brand exists
        const brandExists = await db
          .select({ id: brands.id, sellerId: brands.sellerId })
          .from(brands)
          .where(eq(brands.id, input.brandId))
          .limit(1);

        if (!brandExists.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Brand not found",
          });
        }

        const brand = brandExists[0];
        const offset = (input.page - 1) * input.limit;

        console.log(`[getBrandListings] Brand found:`, {
          id: brand.id,
          sellerId: brand.sellerId,
        });

        // Count total approved listings
        const countResult = await db
          .select({ count: count() })
          .from(listings)
          .where(
            and(
              eq(listings.sellerId, brand.sellerId),
              eq(listings.status, "approved")
            )
          );

        const total = Number(countResult[0]?.count ?? 0);

        // Fetch paginated approved listings
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
          .where(
            and(
              eq(listings.sellerId, brand.sellerId),
              eq(listings.status, "approved")
            )
          )
          .orderBy(desc(listings.createdAt))
          .limit(input.limit)
          .offset(offset);

        console.log(`[getBrandListings] Fetched ${brandListings.length} listings`);

        // OPTIMIZATION: Batch fetch all collection data ONCE (prevents N+1!)
        const collectionIds = brandListings
          .filter((l: any) => l.type === "collection")
          .map((l: any) => l.id);

        const allCollectionItemsData =
          collectionIds.length > 0
            ? await db
                .select()
                .from(collectionItems)
                .where(inArray(collectionItems.collectionId, collectionIds))
            : [];

        const allProductIdsInCollections: string[] = Array.from(
          new Set<string>(
            allCollectionItemsData.map((item: any) => item.productId as string)
          )
        );

        const [allCollectionProducts, allCollectionProductListings, allCollectionProductImages] =
          allProductIdsInCollections.length > 0
            ? await Promise.all([
                db
                  .select()
                  .from(products)
                  .where(inArray(products.id, allProductIdsInCollections)),
                db
                  .select()
                  .from(listings)
                  .where(
                    inArray(listings.productId, allProductIdsInCollections)
                  ),
                db
                  .select()
                  .from(productImages)
                  .where(
                    inArray(productImages.productId, allProductIdsInCollections)
                  )
                  .orderBy(productImages.position),
              ])
            : [[], [], []];

        // Build lookup maps for O(1) access
        const collectionItemsMap = new Map<string, any[]>();
        allCollectionItemsData.forEach((item: any) => {
          const items = collectionItemsMap.get(item.collectionId) || [];
          items.push(item);
          collectionItemsMap.set(item.collectionId, items);
        });

        const productsMap = new Map<string, any>(
          allCollectionProducts.map((p: any) => [p.id, p])
        );
        const productListingsMap = new Map<string, any>(
          allCollectionProductListings.map((l: any) => [l.productId, l])
        );
        const productImagesMap = new Map<string, any[]>();
        allCollectionProductImages.forEach((img: any) => {
          const images = productImagesMap.get(img.productId) || [];
          images.push(img);
          productImagesMap.set(img.productId, images);
        });

        console.log(
          `[getBrandListings] Batch fetched: ${allCollectionItemsData.length} items, ${allCollectionProducts.length} products, ${allCollectionProductImages.length} images`
        );

        // Enrich listings without N+1 queries
        const enrichedListings = brandListings.map((listing: any) => {
          const isCollection = listing.type === "collection";
          let collectionItemCount = 0;
          let collectionTotalPrice = 0;
          let collectionProductsList: any[] = [];
          let allCollectionImages: string[] = [];

          if (isCollection && listing.id) {
            const collectionItemsList =
              collectionItemsMap.get(listing.id) || [];
            collectionItemCount = collectionItemsList.length;

            if (collectionItemsList.length > 0) {
              collectionProductsList = collectionItemsList
                .map((collectionItem: any) => {
                  const product = productsMap.get(collectionItem.productId);
                  const productListing = productListingsMap.get(
                    collectionItem.productId
                  );
                  const productImages =
                    productImagesMap.get(collectionItem.productId) || [];

                  if (!product) return null;

                  const price = (productListing as any)?.priceCents
                    ? (productListing as any).priceCents / 100
                    : (product as any).priceCents
                      ? (product as any).priceCents / 100
                      : 0;
                  collectionTotalPrice += price;

                  productImages.forEach((img: any) => {
                    if (
                      img.imageUrl &&
                      !allCollectionImages.includes(img.imageUrl)
                    ) {
                      allCollectionImages.push(img.imageUrl);
                    }
                  });

                  let colors = null;
                  let sizes = null;
                  if ((productListing as any)?.colorsAvailable) {
                    try {
                      colors = JSON.parse((productListing as any).colorsAvailable);
                    } catch (e) {
                      colors = null;
                    }
                  }
                  if ((productListing as any)?.sizesJson) {
                    try {
                      sizes = JSON.parse((productListing as any).sizesJson);
                    } catch (e) {
                      sizes = null;
                    }
                  }

                  return {
                    id: (product as any).id,
                    title: (product as any).name,
                    description: (product as any).description,
                    price,
                    price_cents: (productListing as any)?.priceCents ?? (product as any).priceCents ?? 0,
                    images: productImages.map((img: any) => img.imageUrl),
                    colors,
                    sizes,
                    material: (productListing as any)?.materialComposition || null,
                    careInstructions: (productListing as any)?.careInstructions || null,
                  };
                })
                .filter((p: any) => p !== null);
            }
          }

          // Parse colors and sizes
          let colors = null;
          let sizes = null;

          if (listing.colorsAvailable) {
            try {
              colors = JSON.parse(listing.colorsAvailable);
            } catch (e) {
              colors = null;
            }
          }

          if (listing.sizes) {
            try {
              sizes = JSON.parse(listing.sizes);
            } catch (e) {
              sizes = null;
            }
          }

          return {
            id: listing.id,
            title: listing.title,
            description: listing.description,
            image: listing.image,
            imagesJson: allCollectionImages.length > 0
              ? JSON.stringify(allCollectionImages)
              : listing.imagesJson,
            price: isCollection ? collectionTotalPrice : (listing.price_cents ? listing.price_cents / 100 : 0),
            price_cents: listing.price_cents || 0,
            currency: listing.currency || "NGN",
            category: listing.category || "general",
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
            colors,
            sizes,
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
            ...(isCollection
              ? {
                  collectionItemCount,
                  collectionTotalPrice,
                  collectionProducts: collectionProductsList,
                }
              : {}),
          };
        });

        const totalPages = Math.ceil(total / input.limit);

        console.log(`✓ Found ${enrichedListings.length} listings for brand`);
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
});
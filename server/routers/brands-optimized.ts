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
import { fetchBrandsWithCache } from "../lib/brands-cache";

export const brandsRouterOptimized = createTRPCRouter({
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
        // Use Redis-cached fetch function for persistent, fast retrieval
        return await fetchBrandsWithCache(input);
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
});
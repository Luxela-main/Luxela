import { createTRPCRouter, publicProcedure } from "../trpc/trpc";
import { TRPCError } from "@trpc/server";
import { db } from "../db";
import { brands, listings, sellerBusiness, buyerBrandFollows, reviews } from "../db/schema";
import { eq, desc, asc, countDistinct, count, sql, inArray } from "drizzle-orm";
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

        // Determine sort order
        let orderBy = desc(brands.totalProducts);
        if (input.sortBy === "name") {
          orderBy = asc(brands.name);
        } else if (input.sortBy === "rating") {
          orderBy = desc(brands.rating);
        } else if (input.sortBy === "products") {
          orderBy = desc(brands.totalProducts);
        }

        // Get all brands first with where condition
        console.log('Building brands query with leftJoin to sellerBusiness...');
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
          console.log('Applying where condition for search...');
          brandsQuery = brandsQuery.where(whereCondition) as any;
        }

        // Apply sorting and pagination
        console.log('Fetching brands with orderBy, limit, offset...');
        const allBrands = await brandsQuery
          .orderBy(orderBy)
          .limit(input.limit)
          .offset(offset);
        
        console.log(`✓ Fetched ${allBrands.length} brands`);

        // Build count query with proper typing
        console.log('Counting total brands...');
        const countResult = await (async () => {
          let query = db
            .select({ count: countDistinct(brands.id) })
            .from(brands);

          if (whereCondition) {
            query = query.where(whereCondition) as any;
          }

          return query;
        })();

        const total = Number(countResult[0]?.count ?? 0);
        const totalPages = Math.ceil(total / input.limit);
        console.log(`✓ Total brands: ${total}, totalPages: ${totalPages}`);

        // Get product counts for all brand seller IDs in one batch query
        console.log(`Fetching product counts for ${allBrands.length} brands...`);
        const sellerIds = allBrands.map(b => b.sellerId);
        let productCountsResult: any[] = [];
        if (sellerIds.length > 0) {
          try {
            productCountsResult = await db
              .select({ sellerId: listings.sellerId, count: count() })
              .from(listings)
              .where(inArray(listings.sellerId, sellerIds))
              .groupBy(listings.sellerId);
          } catch (err) {
            console.warn('Product counts query failed, using fallback');
            productCountsResult = [];
          }
        }
        
        const productCountsMap = new Map(
          productCountsResult.map(r => [r.sellerId, Number(r.count ?? 0)])
        );
        console.log(`✓ Product counts fetched`);

        // Get follower counts for all brand IDs in one batch query
        console.log(`Fetching follower counts for ${allBrands.length} brands...`);
        const brandIds = allBrands.map(b => b.id);
        const followerCountsResult = brandIds.length > 0 ? await db
          .select({
            brandId: buyerBrandFollows.brandId,
            count: count(),
          })
          .from(buyerBrandFollows)
          .where(inArray(buyerBrandFollows.brandId, brandIds))
          .groupBy(buyerBrandFollows.brandId) : [];
        
        const followerCountsMap = new Map(
          followerCountsResult.map(r => [r.brandId, Number(r.count ?? 0)])
        );
        console.log(`✓ Follower counts fetched`);

        // Build final result with counts from maps
        console.log(`Building final result...`);
        const brandsWithProductCount = allBrands.map((item) => {
          const productCount = productCountsMap.get(item.sellerId) ?? 0;
          const followersCount = followerCountsMap.get(item.id) ?? 0;
            
          console.log(`  Brand: ${item.name} (${item.id}) - Products: ${productCount}, Followers: ${followersCount}`);

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

        const result = {
          brands: brandsWithProductCount,
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
            rating: sql`NULL::integer`,
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

        if (!brandData.length) {
          console.log(`Brand not found for ID: ${input.brandId}`);
          throw new Error("Brand not found");
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
          .where(sql`${listings.sellerId} = ${brand.sellerId} AND ${listings.type} = 'collection'`);

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
        if (error?.message === "Brand not found") {
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
        console.log('Slug:', input.slug);

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

        if (!brandData.length) {
          console.log(`Brand not found for slug: ${input.slug}`);
          throw new Error("Brand not found");
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

        const totalProductCount = Number(totalProductCountResult[0]?.count ?? 0);
        const followersCount = Number(followersCountResult[0]?.count ?? 0);

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
            sellerId: brand.sellerId,
            storeLogo: brand.storeLogo,
            storeBanner: brand.storeBanner,
            storeDescription: brand.storeDescription,
            brandName: brand.brandName,
          },
        };
      } catch (error: any) {
        // Handle specific error case for brand not found
        if (error?.message === "Brand not found") {
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

        // Count total approved listings for this brand's seller
        const countResult = await db
          .select({ count: count() })
          .from(listings)
          .where(sql`${listings.sellerId} = ${brand.sellerId} AND ${listings.status} = 'approved'`);

        const total = Number(countResult[0]?.count ?? 0);

        // Fetch approved listings for this brand's seller
        const brandListings = await db
          .select({
            id: listings.id,
            title: listings.title,
            description: listings.description,
            image: listings.image,
            price_cents: sql<number>`COALESCE(${listings.priceCents}, 0)`,
            currency: sql<string>`COALESCE(${listings.currency}, 'NGN')`,
            category: sql<string>`COALESCE(${listings.category}, 'general')`,
            type: listings.type,
            quantity_available: sql<number>`COALESCE(${listings.quantityAvailable}, 0)`,
            seller_id: listings.sellerId,
            created_at: listings.createdAt,
            updated_at: listings.updatedAt,
            slug: listings.slug,
            sku: listings.sku,
            status: listings.status,
          })
          .from(listings)
          .where(sql`${listings.sellerId} = ${brand.sellerId} AND ${listings.status} = 'approved'`)
          .orderBy(desc(listings.createdAt))
          .limit(input.limit)
          .offset(offset);

        const totalPages = Math.ceil(total / input.limit);

        console.log(`✓ Found ${brandListings.length} listings for brand`);
        console.log("=== getBrandListings Query Completed ===");

        return {
          listings: brandListings,
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
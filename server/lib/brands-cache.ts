import { db } from '../db';
import {
  brands,
  listings,
  sellerBusiness,
  buyerBrandFollows,
} from '../db/schema';
import { eq, desc, asc, countDistinct, count, sql, inArray, and } from 'drizzle-orm';
import { catalogCacheMiddleware } from '../middleware/cache-catalog';

export async function fetchBrandsWithCache(input: {
  page: number;
  limit: number;
  search?: string;
  sortBy: 'followers' | 'products' | 'name' | 'rating';
}) {
  // Don't cache search queries as they're more dynamic
  const shouldCache = !input.search;

  // Try to get from cache first if applicable
  if (shouldCache) {
    try {
      const fetchFn = async () => {
        return await fetchBrandsFromDatabase(input);
      };

      const cachedResult = await catalogCacheMiddleware.getCachedAllBrands(
        input.page,
        input.limit,
        input.sortBy,
        undefined,
        fetchFn
      );

      if (cachedResult) {
        console.log(`[CACHE HIT] Returning brands from Redis cache`);
        return cachedResult;
      }
    } catch (cacheError) {
      console.warn(
        `[CACHE WARN] Failed to get cached brands, falling back to DB:`,
        cacheError
      );
    }
  }

  // Fetch from database if not cached
  return await fetchBrandsFromDatabase(input);
}

async function fetchBrandsFromDatabase(input: {
  page: number;
  limit: number;
  search?: string;
  sortBy: 'followers' | 'products' | 'name' | 'rating';
}) {
  const offset = (input.page - 1) * input.limit;

  console.log('=== getAllBrands Query Started ===');
  console.log('Input:', {
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

  // Determine sort order
  let orderByClause = desc(brands.totalProducts);
  if (input.sortBy === 'name') {
    orderByClause = asc(brands.name);
  } else if (input.sortBy === 'rating') {
    orderByClause = desc(brands.rating);
  }

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

  // Only fetch follower counts if needed for sorting
  const brandIds: string[] = allBrands.map((b: any) => b.id) as string[];
  const sellerIds: string[] = Array.from(
    new Set(allBrands.map((b: any) => b.sellerId))
  ) as string[];

  // Execute product and follower count queries IN PARALLEL (optimization!)
  console.log(`Fetching counts for ${allBrands.length} brands...`);

  const [productCountsResult, followerCountsResult] = await Promise.all([
    // Product counts (only for this page's sellers)
    db
      .select({ sellerId: listings.sellerId, count: count() })
      .from(listings)
      .where(
        and(
          inArray(listings.sellerId, sellerIds),
          eq(listings.status, 'approved')
        )
      )
      .groupBy(listings.sellerId),
    // Follower counts (only for this page's brands)
    db
      .select({
        brandId: buyerBrandFollows.brandId,
        count: count(),
      })
      .from(buyerBrandFollows)
      .where(inArray(buyerBrandFollows.brandId, brandIds))
      .groupBy(buyerBrandFollows.brandId),
  ]);

  console.log(`✓ Product and follower counts fetched in parallel`);

  // Build maps for O(1) lookup
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

  // Build final result
  console.log(`Building final result...`);
  let brandsWithCounts = allBrands.map((item: any) => {
    const productCount = productCountsMap.get(item.sellerId) ?? 0;
    const followersCount = followerCountsMap.get(item.id) ?? 0;

    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      logoImage: item.logoImage || item.storeLogo,
      heroImage: item.heroImage || item.storeBanner,
      rating: item.rating ? String(item.rating) : '0',
      totalProducts: productCount,
      followersCount,
      sellerId: item.sellerId,
      storeLogo: item.storeLogo,
      storeBanner: item.storeBanner,
      storeDescription: item.storeDescription,
      brandName: item.brandName,
    };
  });

  // Sort in-memory only for followers (needs the count from separate query)
  if (input.sortBy === 'followers') {
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

  console.log('=== getAllBrands Query Completed ===\n');
  return result;
}
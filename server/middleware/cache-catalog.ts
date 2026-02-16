import { getCached, setCache, invalidateCache } from '../lib/redis';

/**
 * Cache wrapper for catalog queries to improve performance
 * This bypasses slow queries by serving cached data
 */

export const catalogCacheMiddleware = {
  // Cache catalog listings for 5 minutes
  LISTINGS_CATALOG_TTL: 5 * 60,
  
  // Cache collections for 5 minutes  
  COLLECTIONS_TTL: 5 * 60,
  
  // Cache brands for 10 minutes
  BRANDS_TTL: 10 * 60,

  // Get cached catalog listings
  async getCachedListingsCatalog(
    page: number,
    limit: number,
    sortBy: string,
    fetchFn: () => Promise<any>
  ) {
    const cacheKey = `catalog:listings:${page}:${limit}:${sortBy}`;
    return getCached(cacheKey, fetchFn, { ttl: this.LISTINGS_CATALOG_TTL });
  },

  // Get cached approved collections
  async getCachedApprovedCollections(
    limit: number,
    offset: number,
    fetchFn: () => Promise<any>
  ) {
    const cacheKey = `catalog:collections:${limit}:${offset}`;
    return getCached(cacheKey, fetchFn, { ttl: this.COLLECTIONS_TTL });
  },

  // Get cached all brands
  async getCachedAllBrands(
    page: number,
    limit: number,
    sortBy: string,
    search?: string,
    fetchFn?: () => Promise<any>
  ) {
    const cacheKey = `catalog:brands:${page}:${limit}:${sortBy}:${search || 'all'}`;
    if (!fetchFn) {
      return null;
    }
    return getCached(cacheKey, fetchFn, { ttl: this.BRANDS_TTL });
  },

  // Invalidate all catalog caches (call when new listings are added/updated)
  async invalidateCatalogCache() {
    await invalidateCache('catalog:*');
  },

  // Invalidate only listings cache
  async invalidateListingsCache() {
    await invalidateCache('catalog:listings:*');
  },

  // Invalidate only collections cache
  async invalidateCollectionsCache() {
    await invalidateCache('catalog:collections:*');
  },

  // Invalidate only brands cache
  async invalidateBrandsCache() {
    await invalidateCache('catalog:brands:*');
  },
};
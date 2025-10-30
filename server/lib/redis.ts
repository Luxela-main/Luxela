// Redis disabled: providing no-op utilities for local/dev without Redis

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export async function checkRateLimit(
  _key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = Date.now();
  return { allowed: true, remaining: config.limit, resetTime: now + config.windowMs };
}

interface CacheOptions { ttl?: number }

export async function getCached<T>(
  _key: string,
  fetchFn: () => Promise<T>,
  _options: CacheOptions = {}
): Promise<T> {
  return await fetchFn();
}

export async function invalidateCache(_pattern: string): Promise<void> {
  return;
}

export async function setCache<T>(
  _key: string,
  _data: T,
  _ttl: number = 300
): Promise<void> {
  return;
}

export async function deleteCache(_key: string): Promise<void> {
  return;
}

export const CacheKeys = {
  // Buyer
  buyerAccount: (userId: string) => `buyer:account:${userId}`,
  buyerAddresses: (buyerId: string, page: number) => `buyer:addresses:${buyerId}:page:${page}`,
  buyerFavorites: (buyerId: string, page: number) => `buyer:favorites:${buyerId}:page:${page}`,
  buyerOrders: (buyerId: string, status: string, page: number) => `buyer:orders:${buyerId}:${status}:page:${page}`,
  buyerOrderStats: (buyerId: string) => `buyer:stats:${buyerId}`,

  // Seller
  sellerProfile: (userId: string) => `seller:profile:${userId}`,
  sellerListings: (sellerId: string) => `seller:listings:${sellerId}`,
  sellerListingsByCategory: (sellerId: string, category: string) => `seller:listings:${sellerId}:${category}`,

  // Listings
  listing: (listingId: string) => `listing:${listingId}`,
  allListings: (page: number) => `listings:page:${page}`,
};

// RATE LIMIT CONFIGURATIONS

export const RateLimits = {
  profileUpload: { limit: 5, windowMs: 3600000 },
  addressCreate: { limit: 10, windowMs: 3600000 },
  favorite: { limit: 50, windowMs: 3600000 },
  listingCreate: { limit: 20, windowMs: 3600000 },
  general: { limit: 100, windowMs: 60000 },
};
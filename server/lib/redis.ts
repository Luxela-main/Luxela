import { Redis } from 'ioredis';
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  connectTimeout: 10000,
});

redis.on('error', (err) => {
  console.error(' Redis Client Error:', err);
});

redis.on('connect', () => {
  console.log(' Redis connecting...');
});

redis.on('ready', () => {
  console.log(' Redis connected successfully');
  console.log(` Connected to: ${process.env.REDIS_URL ? 'Redis Cloud' : 'Local Redis'}`);
});

redis.on('close', () => {
  console.log('  Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('Redis reconnecting...');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('  Shutting down Redis connection...');
  await redis.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('  Shutting down Redis connection...');
  await redis.quit();
  process.exit(0);
});

// RATE LIMITING UTILITIES

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = Date.now();
  const windowKey = `ratelimit:${key}`;

  try {
    const pipeline = redis.pipeline();
    const windowStart = now - config.windowMs;
    
    pipeline.zremrangebyscore(windowKey, 0, windowStart);
    pipeline.zcard(windowKey);
    pipeline.zadd(windowKey, now, `${now}-${Math.random()}`);
    pipeline.expire(windowKey, Math.ceil(config.windowMs / 1000));
    
    const results = await pipeline.exec();
    
    if (!results) {
      return { allowed: true, remaining: config.limit - 1, resetTime: now + config.windowMs };
    }

    const currentCount = (results[1][1] as number) || 0;
    const allowed = currentCount < config.limit;
    const remaining = Math.max(0, config.limit - currentCount - 1);
    const resetTime = now + config.windowMs;

    return { allowed, remaining, resetTime };
  } catch (error) {
    console.error(' Rate limit check error:', error);
    return { allowed: true, remaining: config.limit - 1, resetTime: now + config.windowMs };
  }
}

// CACHING UTILITIES

interface CacheOptions {
  ttl?: number;
}

export async function getCached<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const ttl = options.ttl || 300;
  const cacheKey = `cache:${key}`;

  try {
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      console.log(`Cache hit: ${key}`);
      return JSON.parse(cached) as T;
    }

    console.log(` Cache miss: ${key}`);
    const data = await fetchFn();
    await redis.setex(cacheKey, ttl, JSON.stringify(data));
    
    return data;
  } catch (error) {
    console.error(' Cache error:', error);
    return await fetchFn();
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(`cache:${pattern}`);
    
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(` Invalidated ${keys.length} cache keys matching: ${pattern}`);
    }
  } catch (error) {
    console.error(' Cache invalidation error:', error);
  }
}

export async function setCache<T>(
  key: string,
  data: T,
  ttl: number = 300
): Promise<void> {
  const cacheKey = `cache:${key}`;
  try {
    await redis.setex(cacheKey, ttl, JSON.stringify(data));
  } catch (error) {
    console.error(' Cache set error:', error);
  }
}

export async function deleteCache(key: string): Promise<void> {
  const cacheKey = `cache:${key}`;
  try {
    await redis.del(cacheKey);
  } catch (error) {
    console.error(' Cache delete error:', error);
  }
}

// CACHE KEY PATTERNS

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
import { Redis } from "ioredis";

// --- REDIS INITIALIZATION ---
const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.error("Missing REDIS_URL in environment variables!");
  process.exit(1);
}

console.log(`Initializing Redis: ${REDIS_URL.startsWith("rediss://") ? "Secure (Upstash)" : "Local"}`);

export const redis = new Redis(REDIS_URL, {
  tls: REDIS_URL.startsWith("rediss://") ? {} : undefined,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000);
    console.warn(`Redis reconnect attempt #${times}, retrying in ${delay}ms`);
    return delay;
  },
  maxRetriesPerRequest: 5,
  enableReadyCheck: true,
  connectTimeout: 15000,
  lazyConnect: false,
});

redis.on("connect", () => console.log("Redis connecting..."));
redis.on("ready", () => console.log("Redis connected successfully"));
redis.on("close", () => console.warn("Redis connection closed"));
redis.on("reconnecting", () => console.log("Redis reconnecting..."));
redis.on("error", (err) => {
  console.error("Redis connection error:", err.message);
  if (err.message.includes("ECONNREFUSED") || err.message.includes("ENOTFOUND")) {
    console.error("Check if your REDIS_URL is correct and accessible.");
  }
});

// --- GRACEFUL SHUTDOWN ---
const gracefulShutdown = async () => {
  try {
    console.log("Shutting down Redis connection...");
    await redis.quit();
    console.log("Redis disconnected cleanly");
  } catch (err) {
    console.error("Error during Redis shutdown:", err);
  } finally {
    process.exit(0);
  }
};

process.once("SIGINT", gracefulShutdown);
process.once("SIGTERM", gracefulShutdown);

// --- RATE LIMITING UTILS ---
interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export async function checkRateLimit(
  _key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = Date.now();
  const windowKey = `ratelimit:${key}`;
  const windowStart = now - config.windowMs;

  try {
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(windowKey, 0, windowStart);
    pipeline.zcard(windowKey);
    pipeline.zadd(windowKey, now, `${now}-${Math.random()}`);
    pipeline.expire(windowKey, Math.ceil(config.windowMs / 1000));

    const results = await pipeline.exec();
    if (!results) {
      return { allowed: true, remaining: config.limit - 1, resetTime: now + config.windowMs };
    }

    const count = (results[1]?.[1] as number) || 0;
    const allowed = count < config.limit;
    const remaining = Math.max(0, config.limit - count - 1);
    const resetTime = now + config.windowMs;

    return { allowed, remaining, resetTime };
  } catch (err) {
    console.error("Rate limit check failed:", err);
    return { allowed: true, remaining: config.limit - 1, resetTime: now + config.windowMs };
  }
}

// --- CACHING UTILS ---
interface CacheOptions {
  ttl?: number;
}

export async function getCached<T>(
  _key: string,
  fetchFn: () => Promise<T>,
  _options: CacheOptions = {}
): Promise<T> {
  const ttl = options.ttl ?? 300;
  const cacheKey = `cache:${key}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`Cache hit: ${key}`);
      return JSON.parse(cached) as T;
    }

    console.log(`Cache miss: ${key}`);
    const data = await fetchFn();
    await redis.setex(cacheKey, ttl, JSON.stringify(data));
    return data;
  } catch (err) {
    console.error("Cache error:", err);
    return await fetchFn();
  }
}

export async function setCache<T>(key: string, data: T, ttl: number = 300): Promise<void> {
  const cacheKey = `cache:${key}`;
  try {
    await redis.setex(cacheKey, ttl, JSON.stringify(data));
  } catch (err) {
    console.error("Cache set error:", err);
  }
}

export async function deleteCache(key: string): Promise<void> {
  const cacheKey = `cache:${key}`;
  try {
    await redis.del(cacheKey);
  } catch (err) {
    console.error("Cache delete error:", err);
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(`cache:${pattern}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`Invalidated ${keys.length} cache keys for pattern: ${pattern}`);
    }
  } catch (err) {
    console.error("Cache invalidation error:", err);
  }
}

// --- CACHE KEY PATTERNS ---
export const CacheKeys = {
  buyerAccount: (userId: string) => `buyer:account:${userId}`,
  buyerAddresses: (buyerId: string, page: number) => `buyer:addresses:${buyerId}:page:${page}`,
  buyerFavorites: (buyerId: string, page: number) => `buyer:favorites:${buyerId}:page:${page}`,
  buyerOrders: (buyerId: string, status: string, page: number) =>
    `buyer:orders:${buyerId}:${status}:page:${page}`,
  buyerOrderStats: (buyerId: string) => `buyer:stats:${buyerId}`,
  sellerProfile: (userId: string) => `seller:profile:${userId}`,
  sellerListings: (sellerId: string) => `seller:listings:${sellerId}`,
  sellerListingsByCategory: (sellerId: string, category: string) =>
    `seller:listings:${sellerId}:${category}`,
  listing: (listingId: string) => `listing:${listingId}`,
  allListings: (page: number) => `listings:page:${page}`,
};

// --- RATE LIMIT CONFIGS ---
export const RateLimits = {
  profileUpload: { limit: 5, windowMs: 3600000 },
  addressCreate: { limit: 10, windowMs: 3600000 },
  favorite: { limit: 50, windowMs: 3600000 },
  listingCreate: { limit: 20, windowMs: 3600000 },
  general: { limit: 100, windowMs: 60000 },
};

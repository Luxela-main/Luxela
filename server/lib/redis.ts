import { Redis } from "ioredis";

// --- REDIS INITIALIZATION ---
const REDIS_URL = process.env.REDIS_URL;
const IS_BUILD_TIME =
  process.env.IS_BUILDING === "true" ||
  process.env.NEXT_PHASE === "phase-production-build";

if (!REDIS_URL && !IS_BUILD_TIME) {
  throw new Error("Missing environment variable: REDIS_URL");
}

if (REDIS_URL) {
  console.log(
    `Initializing Redis: ${REDIS_URL.startsWith("rediss://") ? "Secure (Upstash)" : "Local"}`
  );
}

// Use lazy initialization to avoid connection issues during build
let redisInstance: Redis | null = null;

function initializeRedis(): Redis {
  if (redisInstance) {
    return redisInstance;
  }

  if (!REDIS_URL) {
    throw new Error("Missing environment variable: REDIS_URL");
  }

  redisInstance = new Redis(REDIS_URL, {
    tls: REDIS_URL.startsWith("rediss://") ? {} : undefined,

    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      if (times > 20) {
        console.error(`Redis: Failed to reconnect after ${times} attempts`);
        return undefined;
      }
      if (times > 5) {
        console.warn(
          `Redis reconnect attempt #${times}, retrying in ${delay}ms`
        );
      }
      return delay;
    },

    // Connection pool and request settings
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    enableOfflineQueue: true,

    // Timeouts
    connectTimeout: 10000,
    commandTimeout: 5000,

    // Initialization
    lazyConnect: false,

    // Keep-alive for steady connections
    keepAlive: 30000,
    noDelay: true,

    family: 4,

    // Automatic reconnection on errors
    reconnectOnError: (err) => {
      const targetError = "READONLY";
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
    // Fail faster on connection errors during build
    ...(IS_BUILD_TIME && {
      connectTimeout: 3000,
      commandTimeout: 2000,
      retryStrategy: () => undefined, // Don't retry during build
    }),
  });

  redisInstance.setMaxListeners(100);
  return redisInstance;
}

// Lazy getter to prevent initialization during import
export function getRedis(): Redis | null {
  if (IS_BUILD_TIME) {
    // During build, avoid Redis operations
    return null;
  }
  try {
    return initializeRedis();
  } catch (err) {
    console.warn("Failed to initialize Redis:", err);
    return null;
  }
}

// Initialize once at module load (outside build)
const actualRedis = IS_BUILD_TIME
  ? null
  : (() => {
      try {
        return initializeRedis();
      } catch {
        return null;
      }
    })();

// Export the instance for backward compatibility, but wrapped for safety
const proxyRedis = new Proxy({} as any, {
  get: (target, prop) => {
    const instance = actualRedis;
    if (!instance) {
      if (prop === "setMaxListeners" || prop === "on" || prop === "once") {
        return () => {};
      }
      return null;
    }
    return (instance as any)[prop];
  },
});

export const redis = proxyRedis;

// --- CONNECTION MONITORING ---
if (actualRedis) {
  actualRedis.on("connect", () => console.log("Redis connecting..."));
  actualRedis.on("ready", () => console.log("✓ Redis connected successfully"));
  actualRedis.on("close", () => console.warn("⚠ Redis connection closed"));
  actualRedis.on("reconnecting", () => console.log("↻ Redis reconnecting..."));
  actualRedis.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
    if (
      err.message.includes("ECONNREFUSED") ||
      err.message.includes("ENOTFOUND")
    ) {
      console.error("   Check if your REDIS_URL is correct and accessible.");
    }
  });
}

let connectionStable = true;
let lastStatusCheck = Date.now();

// Health check every 5 seconds (skip during build)
const healthCheckInterval = IS_BUILD_TIME
  ? null
  : setInterval(() => {
      if (!actualRedis) return;

      const now = Date.now();
      const timeSinceLastCheck = now - lastStatusCheck;
      lastStatusCheck = now;

      if (actualRedis.status !== "ready" && connectionStable) {
        connectionStable = false;
        console.warn("⚠️ Redis connection lost at", new Date().toISOString());
      } else if (actualRedis.status === "ready" && !connectionStable) {
        connectionStable = true;
        console.log(
          "✓ Redis connection restored at",
          new Date().toISOString()
        );
      }

      // Log status every 60 seconds
      if (now % 60000 < 5000) {
        console.log(
          `[Health Check] Redis status: ${actualRedis.status}, Uptime: ${timeSinceLastCheck}ms`
        );
      }
    }, 5000);

// --- GRACEFUL SHUTDOWN ---
const gracefulShutdown = async () => {
  try {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
    }
    console.log("Shutting down Redis connection...");
    if (actualRedis) {
      await actualRedis.quit();
      console.log("Redis disconnected cleanly");
    }
  } catch (err) {
    console.error("Error during Redis shutdown:", err);
  } finally {
    process.exit(0);
  }
};

// Only register shutdown handlers outside of build
if (!IS_BUILD_TIME) {
  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
}

// --- RATE LIMITING UTILS ---
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
  const windowStart = now - config.windowMs;

  const instance = actualRedis;
  if (!instance) {
    // Fallback: allow all requests if Redis is unavailable
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetTime: now + config.windowMs,
    };
  }

  try {
    const pipeline = instance.pipeline();
    pipeline.zremrangebyscore(windowKey, 0, windowStart);
    pipeline.zcard(windowKey);
    pipeline.zadd(windowKey, now, `${now}-${Math.random()}`);
    pipeline.expire(windowKey, Math.ceil(config.windowMs / 1000));

    const results = await pipeline.exec();
    if (!results) {
      return {
        allowed: true,
        remaining: config.limit - 1,
        resetTime: now + config.windowMs,
      };
    }

    const count = (results[1]?.[1] as number) || 0;
    const allowed = count < config.limit;
    const remaining = Math.max(0, config.limit - count - 1);
    const resetTime = now + config.windowMs;

    return { allowed, remaining, resetTime };
  } catch (err) {
    console.error("Rate limit check failed:", err);
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetTime: now + config.windowMs,
    };
  }
}

// --- CACHING UTILS ---
interface CacheOptions {
  ttl?: number;
}

// Helper function to revive Date objects from ISO strings
function reviveObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(reviveObject);

  const revived: any = {};
  for (const key in obj) {
    const value = obj[key];
    // Check if string looks like an ISO date
    if (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
    ) {
      revived[key] = new Date(value);
    } else if (typeof value === "object") {
      revived[key] = reviveObject(value);
    } else {
      revived[key] = value;
    }
  }
  return revived;
}

export async function getCached<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const ttl = options.ttl ?? 300;
  const cacheKey = `cache:${key}`;
  const instance = actualRedis;

  try {
    if (!instance) {
      return await fetchFn();
    }
    const cached = await instance.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Revive Date objects from ISO strings
      return reviveObject(parsed) as T;
    }
    const data = await fetchFn();
    if (instance) {
      await instance.setex(cacheKey, ttl, JSON.stringify(data));
    }
    return data;
  } catch (err) {
    console.error("Cache error:", err);
    return await fetchFn();
  }
}

export async function setCache<T>(
  key: string,
  data: T,
  ttl: number = 300
): Promise<void> {
  const cacheKey = `cache:${key}`;
  const instance = actualRedis;

  if (!instance) {
    return;
  }

  try {
    await instance.setex(cacheKey, ttl, JSON.stringify(data));
  } catch (err) {
    console.error("Cache set error:", err);
  }
}

export async function deleteCache(key: string): Promise<void> {
  const cacheKey = `cache:${key}`;
  const instance = actualRedis;

  if (!instance) {
    return;
  }

  try {
    await instance.del(cacheKey);
  } catch (err) {
    console.error("Cache delete error:", err);
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  const instance = actualRedis;

  if (!instance) {
    return;
  }

  try {
    const keys = await instance.keys(`cache:${pattern}*`);
    if (keys.length > 0) {
      await instance.del(...keys);
      console.log(
        `Invalidated ${keys.length} cache keys for pattern: ${pattern}`
      );
    }
  } catch (err) {
    console.error("Cache invalidation error:", err);
  }
}

// --- CACHE KEY PATTERNS ---
export const CacheKeys = {
  buyerAccount: (userId: string) => `buyer:account:${userId}`,
  buyerAddresses: (buyerId: string, page: number) =>
    `buyer:addresses:${buyerId}:page:${page}`,
  buyerFavorites: (buyerId: string, page: number) =>
    `buyer:favorites:${buyerId}:page:${page}`,
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
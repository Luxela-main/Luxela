let redis: any = null;
let redisInitialized = false;

interface RedisClient {
  get: (key: string) => Promise<any>;
  setex: (key: string, ttl: number, value: any) => Promise<any>;
  del: (key: string) => Promise<any>;
  keys: (pattern: string) => Promise<string[]>;
}

function getRedis(): RedisClient | null {
  if (redisInitialized) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[Redis] Upstash credentials not configured');
    redisInitialized = true;
    return null;
  }

  try {
    const Redis = (() => {
      try {
        // eslint-disable-next-line global-require
        const module = require('@upstash/redis');
        return module.Redis || module.default;
      } catch {
        return null;
      }
    })();

    if (!Redis) {
      console.warn('[Redis] @upstash/redis package not installed, using memory cache fallback');
      redisInitialized = true;
      return null;
    }

    redis = new Redis({
      url,
      token,
    });
    console.log('[Redis] Connected successfully');
    redisInitialized = true;
    return redis;
  } catch (err) {
    console.error('[Redis] Connection error:', err);
    redisInitialized = true;
    return null;
  }
}

export interface CacheOptions {
  ttl?: number;
  skipRedis?: boolean;
}

const DEFAULT_TTL = 30 * 60; // 30 minutes

export async function getCacheValue<T = any>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const value = await client.get(key);
    if (value) {
      console.log(`[Redis] Cache hit: ${key}`);
      return value as T;
    }
    return null;
  } catch (err) {
    console.warn(`[Redis] Get error for ${key}:`, err);
    return null;
  }
}

export async function setCacheValue<T = any>(
  key: string,
  value: T,
  options?: CacheOptions
): Promise<boolean> {
  if (options?.skipRedis) return false;

  const client = getRedis();
  if (!client) return false;

  try {
    const ttl = options?.ttl || DEFAULT_TTL;
    await client.setex(key, ttl, value);
    console.log(`[Redis] Cache set: ${key} (TTL: ${ttl}s)`);
    return true;
  } catch (err) {
    console.warn(`[Redis] Set error for ${key}:`, err);
    return false;
  }
}

export async function invalidateCacheKey(key: string): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;

  try {
    await client.del(key);
    console.log(`[Redis] Cache invalidated: ${key}`);
    return true;
  } catch (err) {
    console.warn(`[Redis] Delete error for ${key}:`, err);
    return false;
  }
}

export async function invalidateCachePattern(pattern: string): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => client.del(key)));
      console.log(`[Redis] Pattern invalidated: ${pattern} (${keys.length} keys)`);
    }
    return true;
  } catch (err) {
    console.warn(`[Redis] Pattern delete error for ${pattern}:`, err);
    return false;
  }
}

export function createCacheKey(namespace: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return `cache:${namespace}`;
  }
  const paramStr = JSON.stringify(params);
  return `cache:${namespace}:${Buffer.from(paramStr).toString('base64')}`;
}

export const CACHE_KEYS = {
  BRANDS: 'brands',
  COLLECTIONS: 'collections',
  PRODUCTS: 'products',
  LISTINGS: 'listings',
  BUYER_CATALOG: 'buyer_catalog',
  BRAND_DETAILS: 'brand_details',
  COLLECTION_DETAILS: 'collection_details',
};

export const CACHE_TTL = {
  SHORT: 5 * 60,
  MEDIUM: 15 * 60,
  LONG: 60 * 60,
  VERY_LONG: 24 * 60 * 60,
};

export async function getOrFetchCache<T = any>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  const cached = await getCacheValue<T>(key);
  if (cached) {
    return cached;
  }

  const data = await fetcher();
  await setCacheValue(key, data, { ttl });
  return data;
}
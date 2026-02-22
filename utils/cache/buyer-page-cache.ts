import { createClient } from '@supabase/supabase-js';

export interface CacheLayer {
  memory: Map<string, { data: any; ttl: number; timestamp: number }>;
  localStorage: Storage | null;
  supabase: ReturnType<typeof createClient> | null;
  redis: any;
}

const CACHE_KEYS = {
  BRANDS: 'buyer:brands',
  COLLECTIONS: 'buyer:collections',
  LISTINGS: 'buyer:listings',
  FAVORITES: 'buyer:favorites',
  BRANDS_META: 'buyer:brands:meta',
  COLLECTIONS_META: 'buyer:collections:meta',
} as const;

const CACHE_TTL = {
  MEMORY: 5 * 60 * 1000,
  LOCAL_STORAGE: 30 * 60 * 1000,
  SUPABASE: 1 * 60 * 60 * 1000,
  REDIS: 24 * 60 * 60 * 1000,
} as const;

class BuyerPageCache {
  private memoryCache: Map<string, { data: any; ttl: number; timestamp: number }> = new Map();
  private localStorage: Storage | null = null;
  private supabase: ReturnType<typeof createClient> | null = null;
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.localStorage = window.localStorage;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    this.isInitialized = true;
  }

  private isExpired(timestamp: number, ttl: number): boolean {
    return Date.now() - timestamp > ttl;
  }

  private encodeKey(key: string, params?: any): string {
    if (!params || Object.keys(params).length === 0) {
      return key;
    }
    return `${key}:${JSON.stringify(params)}`;
  }

  private decodeValue(raw: string): any {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async getFromMemory<T = any>(key: string, params?: any): Promise<T | null> {
    const encodedKey = this.encodeKey(key, params);
    const cached = this.memoryCache.get(encodedKey);

    if (cached && !this.isExpired(cached.timestamp, cached.ttl)) {
      return cached.data;
    }

    if (cached) {
      this.memoryCache.delete(encodedKey);
    }

    return null;
  }

  async getFromLocalStorage<T = any>(key: string, params?: any): Promise<T | null> {
    if (!this.localStorage) return null;

    const encodedKey = this.encodeKey(key, params);
    try {
      const raw = this.localStorage.getItem(encodedKey);
      if (!raw) return null;

      const cached = this.decodeValue(raw);
      if (!cached) return null;

      if (this.isExpired(cached.timestamp, CACHE_TTL.LOCAL_STORAGE)) {
        this.localStorage.removeItem(encodedKey);
        return null;
      }

      return cached.data;
    } catch (err) {
      console.warn(`[Cache] localStorage read error for ${key}:`, err);
      return null;
    }
  }

  async getFromSupabase<T = any>(
    table: string,
    key: string,
    params?: any
  ): Promise<T | null> {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from(table)
        .select('*')
        .eq('cache_key', this.encodeKey(key, params))
        .single();

      if (error || !data) return null;

      const cached = data.data;
      if (this.isExpired(data.created_at, CACHE_TTL.SUPABASE)) {
        await this.supabase
          .from(table)
          .delete()
          .eq('cache_key', this.encodeKey(key, params));
        return null;
      }

      return cached;
    } catch (err) {
      console.warn(`[Cache] Supabase read error for ${key}:`, err);
      return null;
    }
  }

  async set<T = any>(
    key: string,
    data: T,
    params?: any,
    options?: { skipMemory?: boolean; skipLocalStorage?: boolean; skipSupabase?: boolean }
  ): Promise<void> {
    const encodedKey = this.encodeKey(key, params);
    const timestamp = Date.now();

    if (!options?.skipMemory) {
      this.memoryCache.set(encodedKey, {
        data,
        ttl: CACHE_TTL.MEMORY,
        timestamp,
      });
    }

    if (!options?.skipLocalStorage && this.localStorage) {
      try {
        this.localStorage.setItem(
          encodedKey,
          JSON.stringify({
            data,
            timestamp,
          })
        );
      } catch (err) {
        console.warn(`[Cache] localStorage write error for ${key}:`, err);
      }
    }

    if (!options?.skipSupabase && this.supabase) {
      try {
        await this.supabase.from('cache_store').upsert({
          cache_key: encodedKey,
          data,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn(`[Cache] Supabase write error for ${key}:`, err);
      }
    }
  }

  async getOrFetch<T = any>(
    key: string,
    fetcher: () => Promise<T>,
    params?: any,
    options?: { skipCache?: boolean }
  ): Promise<T> {
    if (!options?.skipCache) {
      const cached = await this.getFromMemory<T>(key, params);
      if (cached) {
        console.log(`[Cache] Memory hit for ${key}`);
        return cached;
      }

      const localStorageCached = await this.getFromLocalStorage<T>(key, params);
      if (localStorageCached) {
        console.log(`[Cache] localStorage hit for ${key}`);
        await this.set(key, localStorageCached, params, { skipLocalStorage: true });
        return localStorageCached;
      }
    }

    console.log(`[Cache] Cache miss for ${key}, fetching...`);
    const data = await fetcher();
    await this.set(key, data, params);
    return data;
  }

  invalidate(key: string, params?: any): void {
    const encodedKey = this.encodeKey(key, params);
    this.memoryCache.delete(encodedKey);

    if (this.localStorage) {
      try {
        this.localStorage.removeItem(encodedKey);
      } catch (err) {
        console.warn(`[Cache] localStorage clear error for ${key}:`, err);
      }
    }
  }

  invalidateAll(): void {
    this.memoryCache.clear();

    if (this.localStorage) {
      try {
        const keysToDelete: string[] = [];
        for (let i = 0; i < this.localStorage.length; i++) {
          const key = this.localStorage.key(i);
          if (key && key.startsWith('buyer:')) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach((key) => this.localStorage?.removeItem(key));
      } catch (err) {
        console.warn('[Cache] localStorage clear error:', err);
      }
    }
  }
}

export const buyerPageCache = new BuyerPageCache();

export const cacheKeys = CACHE_KEYS;
export const cacheTTL = CACHE_TTL;

export async function prefetchBuyerPageData(limit: number = 8) {
  console.log('[Cache] Starting prefetch for buyer page data...');

  const startTime = performance.now();

  try {
    const [brands, collections] = await Promise.all([
      fetch(`/api/trpc/brands.getAllBrands?input=${JSON.stringify({ page: 1, limit, sortBy: 'followers' })}`).then(
        (r) => r.json()
      ),
      fetch(`/api/trpc/collection.getApprovedCollections?input=${JSON.stringify({ limit, offset: 0 })}`).then(
        (r) => r.json()
      ),
    ]);

    const brandsData = Array.isArray(brands) ? brands[0]?.result?.data : brands.result?.data;
    const collectionsData = Array.isArray(collections)
      ? collections[0]?.result?.data
      : collections.result?.data;

    await Promise.all([
      buyerPageCache.set(CACHE_KEYS.BRANDS, brandsData, { limit, page: 1, sortBy: 'followers' }),
      buyerPageCache.set(CACHE_KEYS.COLLECTIONS, collectionsData, { limit }),
    ]);

    const endTime = performance.now();
    console.log(`[Cache] Prefetch completed in ${(endTime - startTime).toFixed(2)}ms`);
  } catch (err) {
    console.error('[Cache] Prefetch error:', err);
  }
}
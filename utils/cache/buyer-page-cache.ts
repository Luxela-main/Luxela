export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  size?: number;
}

export interface CacheLayer {
  memory: Map<string, CacheEntry>;
  localStorage: Storage | null;
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
} as const;

// Max size for localStorage entries (100KB per entry to avoid quota issues)
const MAX_STORAGE_SIZE = 100 * 1024;

// Total max for buyer cache (1MB to leave room for other data)
const MAX_TOTAL_CACHE_SIZE = 1 * 1024 * 1024;

class BuyerPageCache {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private localStorage: Storage | null = null;
  private isInitialized = false;
  private totalStorageSize = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.localStorage = window.localStorage;
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

  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  private calculateTotalStorageSize(): number {
    if (!this.localStorage) return 0;
    
    let total = 0;
    try {
      for (let i = 0; i < this.localStorage.length; i++) {
        const key = this.localStorage.key(i);
        if (key && key.startsWith('buyer:')) {
          const value = this.localStorage.getItem(key);
          if (value) total += value.length;
        }
      }
    } catch (err) {
      console.warn('[Cache] Error calculating storage size:', err);
    }
    
    return total;
  }

  private cleanupOldestEntries(): void {
    if (!this.localStorage) return;

    try {
      const entries: Array<[string, number]> = [];
      
      for (let i = 0; i < this.localStorage.length; i++) {
        const key = this.localStorage.key(i);
        if (key && key.startsWith('buyer:')) {
          const value = this.localStorage.getItem(key);
          if (value) {
            try {
              const cached = this.decodeValue(value);
              if (cached?.timestamp) {
                entries.push([key, cached.timestamp]);
              }
            } catch {
              // Skip entries that can't be parsed
            }
          }
        }
      }

      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a[1] - b[1]);

      // Remove oldest entries until we're under the limit
      for (const [key] of entries.slice(0, Math.ceil(entries.length / 4))) {
        try {
          this.localStorage.removeItem(key);
          console.log(`[Cache] Cleaned up old entry: ${key}`);
        } catch (err) {
          console.warn(`[Cache] Error removing ${key}:`, err);
        }
      }
    } catch (err) {
      console.warn('[Cache] Error during cleanup:', err);
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



  async set<T = any>(
    key: string,
    data: T,
    params?: any,
    options?: { skipMemory?: boolean; skipLocalStorage?: boolean }
  ): Promise<void> {
    const encodedKey = this.encodeKey(key, params);
    const timestamp = Date.now();
    const dataSize = this.estimateSize(data);

    if (!options?.skipMemory) {
      this.memoryCache.set(encodedKey, {
        data,
        ttl: CACHE_TTL.MEMORY,
        timestamp,
        size: dataSize,
      });
    }

    if (!options?.skipLocalStorage && this.localStorage) {
      // Skip localStorage if data is too large
      if (dataSize > MAX_STORAGE_SIZE) {
        console.warn(`[Cache] Data too large for localStorage (${dataSize} bytes > ${MAX_STORAGE_SIZE} bytes): ${key}`);
        return;
      }

      try {
        const cacheEntry = JSON.stringify({
          data,
          timestamp,
        });

        // Check if we need to cleanup first
        const currentSize = this.calculateTotalStorageSize();
        if (currentSize + cacheEntry.length > MAX_TOTAL_CACHE_SIZE) {
          console.warn(`[Cache] Total size (${currentSize} bytes) exceeds limit, cleaning up...`);
          this.cleanupOldestEntries();
        }

        this.localStorage.setItem(encodedKey, cacheEntry);
        console.log(`[Cache] Stored to localStorage: ${key} (${cacheEntry.length} bytes)`);
      } catch (err: any) {
        // Handle QuotaExceededError specifically
        if (err instanceof DOMException && (
          err.code === 22 ||
          err.code === 1014 ||
          err.name === 'QuotaExceededError' ||
          err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
        )) {
          console.warn(`[Cache] localStorage quota exceeded for ${key}, attempting cleanup...`);
          this.cleanupOldestEntries();
          
          // Try one more time after cleanup
          try {
            const cacheEntry = JSON.stringify({ data, timestamp });
            this.localStorage?.setItem(encodedKey, cacheEntry);
            console.log(`[Cache] Successfully stored after cleanup: ${key}`);
          } catch (retryErr) {
            console.warn(`[Cache] Failed to store even after cleanup for ${key}:`, retryErr);
          }
        } else {
          console.warn(`[Cache] localStorage write error for ${key}:`, err);
        }
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
    // Use GET for tRPC query procedures (POST is only for mutations)
    const brandsInput = encodeURIComponent(JSON.stringify({ page: 1, limit, sortBy: 'followers' }));
    const collectionsInput = encodeURIComponent(JSON.stringify({ limit, offset: 0 }));
    
    const [brands, collections] = await Promise.all([
      fetch(`/api/trpc/brands.getAllBrands?input=${brandsInput}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }).then((r) => r.json()),
      fetch(`/api/trpc/collection.getApprovedCollections?input=${collectionsInput}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }).then((r) => r.json()),
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
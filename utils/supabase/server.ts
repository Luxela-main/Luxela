import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Request deduplication and caching for getUser
interface CachedUser {
  user: any;
  timestamp: number;
  promise?: Promise<any>;
}

const userCache = new Map<string, CachedUser>();
const CACHE_TTL_MS = 5000; // Cache for 5 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Sleep helper for exponential backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is a rate limit error
 */
function isRateLimitError(error: any): boolean {
  return error?.message?.toLowerCase().includes('rate limit') || 
         error?.status === 429 ||
         error?.code === '429' ||
         error?.name === 'AuthApiError';
}

/**
 * Get cache key from cookie store
 */
async function getCacheKey(cookieStore: any): Promise<string> {
  const allCookies = cookieStore.getAll();
  const sessionCookie = allCookies.find((c: any) => c.name.includes('session'));
  return sessionCookie?.value || 'anonymous';
}

/**
 * Creates a Supabase client for use in Server Components,
 * Route Handlers, and Proxy (Middleware) in Next.js.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignore — happens in environments where cookies can't be set
          }
        },
      },
    }
  );

  // Wrap getUser with caching and rate limit protection
  const originalGetUser = client.auth.getUser.bind(client.auth);
  
  client.auth.getUser = async function(...args: any[]) {
    const cacheKey = await getCacheKey(cookieStore);
    const now = Date.now();
    const cached = userCache.get(cacheKey);
    
    // Return cached user if valid
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
      return { data: { user: cached.user }, error: null };
    }
    
    // Deduplicate concurrent requests
    if (cached?.promise) {
      return cached.promise;
    }
    
    // Create new request with retry logic
    const requestPromise = (async () => {
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const result = await originalGetUser(...args);
          
          if (result.error && isRateLimitError(result.error)) {
            const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
            console.warn(`[Supabase] Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
            await sleep(delay);
            continue;
          }
          
          // Cache successful result
          if (!result.error) {
            userCache.set(cacheKey, {
              user: result.data?.user,
              timestamp: Date.now(),
            });
          }
          
          return result;
        } catch (error) {
          if (isRateLimitError(error) && attempt < MAX_RETRIES - 1) {
            const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
            console.warn(`[Supabase] Rate limit exception, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
            await sleep(delay);
            continue;
          }
          throw error;
        }
      }
      
      // All retries exhausted
      return { data: { user: null }, error: new Error('Rate limit exceeded after retries') };
    })();
    
    // Store promise for deduplication (remove after completion)
    userCache.set(cacheKey, {
      user: cached?.user || null,
      timestamp: now,
      promise: requestPromise,
    });
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clear promise from cache
      const current = userCache.get(cacheKey);
      if (current) {
        delete current.promise;
      }
    }
  };

  return client;
}

/**
 * Creates a Supabase admin client with service role key.
 * Use this ONLY for admin operations (listUsers, updateUserById, etc).
 * IMPORTANT: This must be used server-side only with proper authorization checks.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey);
}
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------- User type definition ----------
export type User = {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  avatar_url?: string;
  admin?: boolean;
};

// ---------- Create ANON client for auth ----------
function getAuthClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, {
    auth: { persistSession: false },
    global: {
      fetch: ((url: string | Request, options?: RequestInit) => {
        // Add a timeout to fetch requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // Increased from 30s to 60s
        return fetch(url, { ...options, signal: controller.signal })
          .finally(() => clearTimeout(timeoutId));
      }) as any,
    },
  });
}

// ---------- Create SERVICE ROLE client for admin/DB operations ----------
function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, service, {
    auth: { persistSession: false },
    global: {
      fetch: ((url: string | Request, options?: RequestInit) => {
        // Add a timeout to fetch requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // Increased from 30s to 60s
        return fetch(url, { ...options, signal: controller.signal })
          .finally(() => clearTimeout(timeoutId));
      }) as any,
    },
  });
}

// ---------- Extract Supabase session from cookies ----------
function extractSessionFromCookies(req: any): { access_token?: string; refresh_token?: string } | null {
  if (!req) return null;

  try {
    let cookieString = "";
    
    // Fetch API style (NextRequest)
    if (typeof req.headers?.get === "function") {
      cookieString = req.headers.get("cookie") || "";
    } else if (typeof req.headers === "object") {
      // Express/Node style
      cookieString = req.headers.cookie || "";
    }

    if (!cookieString) return null;

    // Parse cookies
    const cookies = cookieString.split(";").reduce((acc: any, cookie: string) => {
      const [key, value] = cookie.trim().split("=");
      if (key && value) {
        acc[key] = decodeURIComponent(value);
      }
      return acc;
    }, {});

    // Find Supabase auth token cookie (format: sb-{projectRef}-auth-token)
    let authTokenJson = null;
    for (const [key, value] of Object.entries(cookies)) {
      if (key.includes("auth-token") && key.includes("sb-")) {
        try {
          authTokenJson = JSON.parse(value as string);
          break;
        } catch (e) {
          // Not a JSON token, skip
        }
      }
    }

    if (authTokenJson && typeof authTokenJson === "object") {
      return {
        access_token: (authTokenJson as any).access_token,
        refresh_token: (authTokenJson as any).refresh_token,
      };
    }

    return null;
  } catch (err) {
    console.warn("Error extracting session from cookies:", err);
    return null;
  }
}

// ---------- Extract Bearer token from Authorization header (fallback) ----------
function extractAuthorizationHeader(req: any): string | null {
  if (!req) return null;

  // Fetch API style (req: Request with Headers object)
  if (typeof req.headers?.get === "function") {
    const header = req.headers.get("authorization");
    if (header && typeof header === "string") return header;
  }

  // Local Node/Express-style (req.headers.authorization as string)
  const header1 = req.headers?.authorization;
  if (header1 && typeof header1 === "string") return header1;

  return null;
}

function parseBearerToken(header?: string | null) {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" ? token : null;
}

// ---------- tRPC context ----------
export async function createTRPCContext({ req, res }: { req?: any; res?: any }) {
  // First, try to extract session from cookies (Supabase auth)
  const session = extractSessionFromCookies(req);
  let token: string | null = session?.access_token ?? null;
  
  // Fallback to Authorization header if no cookie session
  if (!token) {
    const rawAuthHeader = extractAuthorizationHeader(req);
    token = parseBearerToken(rawAuthHeader);
  }

  const authClient = getAuthClient();
  const adminClient = getAdminClient();

  // Extract admin flag from proxy headers
  const adminFlagHeader = req?.headers?.['x-admin-flag'] || req?.headers?.get?.('x-admin-flag');
  const isAdmin = adminFlagHeader === 'true' || adminFlagHeader === true;

  let user: User | null = null;

  if (token) {
    try {
      // Only the ANON client can call getUser
      const { data, error } = await authClient.auth.getUser(token);
      if (error) {
        console.warn("Supabase getUser error:", error.message, error.code);
        user = null;
      } else if (data?.user) {
        user = {
          id: data.user.id,
          email: data.user.email ?? undefined,
          name: data.user.user_metadata?.full_name,
          role: data.user.user_metadata?.role,
          avatar_url: data.user.user_metadata?.avatar_url as string | undefined,
          admin: isAdmin || data.user.user_metadata?.admin === true,
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const isAbortError = err instanceof Error && err.name === "AbortError";
      const isDOMException = err instanceof Error && (err as any).name === "DOMException";
      
      if (isAbortError || isDOMException) {
        console.warn("[AUTH_TIMEOUT] Supabase auth request aborted (60s timeout)", {
          errorName: (err as Error).name,
          errorMessage: errorMessage,
          timestamp: new Date().toISOString(),
        });
        // On timeout, set user to null and let router-level auth checks handle it
        user = null;
      } else {
        console.warn("Failed to verify JWT token:", errorMessage);
        user = null;
      }
    }
  }

  return {
    req,
    res,
    supabase: adminClient,
    user,
    accessToken: token,
  };
}

// ---------- Type for tRPC context ----------
export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
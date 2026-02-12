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
        // Reduced timeout from 60s to 10s - fail fast to prevent request timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
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
        // Reduced timeout from 60s to 10s - fail fast to prevent request timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
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

// ---------- JWT Token Decoder (Fallback) ----------
// Decodes and extracts user info from JWT token when Supabase API call fails
function decodeJWTToken(token: string): User | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.warn("[AUTH] Invalid JWT format - expected 3 parts, got", parts.length);
      return null;
    }
    
    // Decode the payload (second part)
    // Add padding if necessary (base64 requires padding to multiple of 4)
    let payload = parts[1];
    const padding = 4 - (payload.length % 4);
    if (padding !== 4) {
      payload += "=".repeat(padding);
    }
    
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
    
    if (!decoded.sub && !decoded.user_id) {
      console.warn("[AUTH] JWT missing sub or user_id claim");
      return null;
    }
    
    // Extract user info from JWT claims
    return {
      id: decoded.sub || decoded.user_id,
      email: decoded.email || undefined,
      name: decoded.name || decoded.user_name || undefined,
      role: decoded.role || decoded.user_role || undefined,
      avatar_url: decoded.avatar_url || decoded.picture || undefined,
      admin: decoded.admin === true || decoded.role === "admin",
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn("[AUTH] Failed to decode JWT token:", errorMsg);
    return null;
  }
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
    if (token) {
      console.log("[AUTH] Token extracted from Authorization header");
    }
  } else {
    console.log("[AUTH] Token extracted from cookie");
  }

  const authClient = getAuthClient();
  const adminClient = getAdminClient();

  // Extract admin flag from proxy headers
  const adminFlagHeader = req?.headers?.["x-admin-flag"] || req?.headers?.get?.("x-admin-flag");
  const isAdmin = adminFlagHeader === "true" || adminFlagHeader === true;

  let user: User | null = null;

  if (token) {
    console.log("[AUTH] Token found, attempting to verify with Supabase...");
    try {
      // Only the ANON client can call getUser
      const { data, error } = await authClient.auth.getUser(token);
      
      if (error) {
        console.error("[AUTH] Supabase getUser error:", {
          message: error.message,
          code: error.code,
          status: (error as any).status,
          tokenLength: token?.length,
        });
        
        // FALLBACK: If getUser fails, try to decode JWT token directly
        // This handles cases where Supabase API is temporarily unavailable
        console.log("[AUTH] Attempting JWT token decode fallback...");
        user = decodeJWTToken(token);
        
        if (user) {
          console.log("[AUTH] User extracted from JWT token fallback:", { userId: user.id, email: user.email });
        } else {
          console.warn("[AUTH] JWT decode fallback also failed");
          user = null;
        }
      } else if (data?.user) {
        // Determine user role: check if they're an admin or have a specific role
        const isAdminUser = isAdmin || data.user.user_metadata?.admin === true;
        const userRole = isAdminUser ? "admin" : (data.user.user_metadata?.role ?? undefined);
        
        user = {
          id: data.user.id,
          email: data.user.email ?? undefined,
          name: data.user.user_metadata?.full_name,
          role: userRole,
          avatar_url: data.user.user_metadata?.avatar_url as string | undefined,
          admin: isAdminUser,
        };
        console.log("[AUTH] User authenticated successfully:", { userId: user.id, email: user.email, role: user.role });
      } else {
        console.log("[AUTH] User data is null or undefined despite successful response");
        // Try JWT fallback even on successful response if no user data
        user = decodeJWTToken(token);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const isAbortError = err instanceof Error && err.name === "AbortError";
      const isDOMException = err instanceof Error && (err as any).name === "DOMException";
      
      if (isAbortError || isDOMException) {
        console.warn("[AUTH_TIMEOUT] Supabase auth request aborted (10s timeout)", {
          errorName: (err as Error).name,
          errorMessage: errorMessage,
          timestamp: new Date().toISOString(),
        });
        // On timeout, try JWT fallback before giving up
        console.log("[AUTH] Attempting JWT token decode due to timeout...");
        user = decodeJWTToken(token);
        if (!user) {
          user = null;
        }
      } else {
        console.error("[AUTH] Failed to verify JWT token:", {
          errorMessage,
          errorName: err instanceof Error ? err.name : typeof err,
          tokenLength: token?.length,
        });
        user = null;
      }
    }
  } else {
    console.log("[AUTH] No token found in request - user will be null");
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
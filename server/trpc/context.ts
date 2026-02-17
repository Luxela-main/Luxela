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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
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

    // Find Supabase auth token cookie
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

// ---------- Extract Bearer token from Authorization header ----------
function extractAuthorizationHeader(req: any): string | null {
  if (!req) return null;

  if (typeof req.headers?.get === "function") {
    const header = req.headers.get("authorization");
    if (header && typeof header === "string") return header;
  }

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
function decodeJWTToken(token: string): User | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    
    let payload = parts[1];
    const padding = 4 - (payload.length % 4);
    if (padding !== 4) {
      payload += "=".repeat(padding);
    }
    
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
    
    if (!decoded.sub && !decoded.user_id) {
      return null;
    }
    
    return {
      id: decoded.sub || decoded.user_id,
      email: decoded.email || undefined,
      name: decoded.name || decoded.user_name || undefined,
      role: decoded.role || decoded.user_role || undefined,
      avatar_url: decoded.avatar_url || decoded.picture || undefined,
      admin: decoded.admin === true || decoded.role === "admin",
    };
  } catch (error) {
    return null;
  }
}

// ---------- tRPC context ----------
export async function createTRPCContext({ req, res }: { req?: any; res?: any }) {
  const session = extractSessionFromCookies(req);
  let token: string | null = session?.access_token ?? null;
  
  if (!token) {
    const rawAuthHeader = extractAuthorizationHeader(req);
    token = parseBearerToken(rawAuthHeader);
  }

  const authClient = getAuthClient();
  const adminClient = getAdminClient();

  const adminFlagHeader = req?.headers?.["x-admin-flag"] || req?.headers?.get?.("x-admin-flag");
  const isAdmin = adminFlagHeader === "true" || adminFlagHeader === true;

  let user: User | null = null;

  if (token) {
    try {
      const { data, error } = await authClient.auth.getUser(token);
      
      if (error) {
        user = decodeJWTToken(token);
      } else if (data?.user) {
        const metadataAdmin = data.user.user_metadata?.admin === true;
        const metadataRole = data.user.user_metadata?.role;
        const isAdminUser = isAdmin || metadataAdmin;
        const userRole = isAdminUser ? "admin" : (metadataRole ?? undefined);
        
        user = {
          id: data.user.id,
          email: data.user.email ?? undefined,
          name: data.user.user_metadata?.full_name,
          role: userRole,
          avatar_url: data.user.user_metadata?.avatar_url as string | undefined,
          admin: isAdminUser,
        };
      } else {
        user = decodeJWTToken(token);
      }
    } catch (err) {
      const isAbortError = err instanceof Error && (err.name === "AbortError" || (err as any).name === "DOMException");
      if (isAbortError) {
        user = decodeJWTToken(token);
      } else {
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
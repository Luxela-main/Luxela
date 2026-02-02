import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
        const timeoutId = setTimeout(() => controller.abort(), 30000);
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
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        return fetch(url, { ...options, signal: controller.signal })
          .finally(() => clearTimeout(timeoutId));
      }) as any,
    },
  });
}

// ---------- Extract Bearer token from headers ----------
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
  const rawAuthHeader = extractAuthorizationHeader(req);
  const token = parseBearerToken(rawAuthHeader);

  const authClient = getAuthClient();
  const adminClient = getAdminClient();

  let user: {
    id: string;
    email?: string;
    name?: string;
    role?: string;
    avatar_url?: string;
  } | null = null;

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
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const isAbortError = err instanceof Error && err.name === "AbortError";
      const isDOMException = err instanceof Error && (err as any).name === "DOMException";
      
      if (isAbortError || isDOMException) {
        console.warn("[AUTH_TIMEOUT] Supabase auth request aborted (30s timeout)", {
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
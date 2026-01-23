import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { inferAsyncReturnType } from "@trpc/server";

// ---------- Create ANON client for auth ----------
function getAuthClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, { auth: { persistSession: false } });
}

// ---------- Create SERVICE ROLE client for admin/DB operations ----------
function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, service, { auth: { persistSession: false } });
}

// ---------- Extract Bearer token from headers ----------
function extractAuthorizationHeader(req: any): string | null {
  if (!req) return null;

  // Local Node/Express-style (req.headers.authorization)
  const header1 = req.headers?.authorization;
  if (header1 && typeof header1 === "string") return header1;

  // Vercel Serverless Fetch API style (req: Request)
  if (typeof req.headers?.get === "function") {
    const header2 = req.headers.get("authorization");
    if (header2 && typeof header2 === "string") return header2;
  }

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
      const { data } = await authClient.auth.getUser(token);
      if (data?.user) {
        user = {
          id: data.user.id,
          email: data.user.email ?? undefined,
          name: data.user.user_metadata?.full_name,
          role: data.user.user_metadata?.role,
          avatar_url: data.user.user_metadata?.avatar_url as string | undefined,
        };
      }
    } catch (err) {
      console.warn("Invalid JWT token", err);
      user = null;
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
export type TRPCContext = inferAsyncReturnType<typeof createTRPCContext>;

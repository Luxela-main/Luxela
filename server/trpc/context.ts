import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { inferAsyncReturnType } from "@trpc/server";

let supabase: SupabaseClient | null = null;

// Create a server-safe Supabase instance (anon key only)
function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn("Missing Supabase env vars.");
    return null;
  }

  supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabase;
}

// Extract Bearer token
function getBearerToken(header?: string) {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" ? token : null;
}

// Extract cookie token for browser requests
function getCookieToken(req: any) {
  const cookie = req?.headers?.cookie;
  if (!cookie) return null;

  const match = cookie.match(/sb-access-token=([^;]+)/);
  return match ? match[1] : null;
}

export async function createTRPCContext({ req, res }: { req?: any; res?: any }) {
  const sb = getSupabase();
  let user = null;

  if (sb) {
    const token =
      getBearerToken(req?.headers?.authorization) ||
      getCookieToken(req);

    if (token) {
      const { data, error } = await sb.auth.getUser(token);
      if (!error && data.user) {
        user = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.full_name,
          role: data.user.user_metadata?.role,
        };
      }
    }
  }

  return { req, res, supabase: sb, user, session: null };
}

export type TRPCContext = inferAsyncReturnType<typeof createTRPCContext>;
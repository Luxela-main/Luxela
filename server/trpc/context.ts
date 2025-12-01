// server/trpc/context.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { inferAsyncReturnType } from "@trpc/server";

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn(
      "Supabase env missing; auth context will treat requests as unauthenticated"
    );
    return null;
  }

  supabase = createClient(url, key);
  return supabase;
}

function getBearerToken(header?: string) {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" ? token : null;
}

export async function createTRPCContext({ req, res }: { req?: any; res?: any }) {
  const token = getBearerToken(req?.headers?.authorization);
  const sb = getSupabase();
  let user: { id: string; email: string; name?: string; role?: string } | null = null;

  if (token && sb) {
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

  return { req, res, supabase: sb, user, session: null };
}

// Type for tRPC context
export type TRPCContext = inferAsyncReturnType<typeof createTRPCContext>;

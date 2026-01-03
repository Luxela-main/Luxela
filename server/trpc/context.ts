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
function getBearerToken(header?: string) {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" ? token : null;
}

// ---------- tRPC context ----------
export async function createTRPCContext({ req, res }: { req?: any; res?: any }) {
  const token = getBearerToken(req?.headers?.authorization);

  const authClient = getAuthClient(); 
  const adminClient = getAdminClient(); 

  let user: {
    id: string;
    email: string;
    name?: string;
    role?: string;
  } | null = null;

  if (token) {
    // Only the ANON client can call getUser
    const { data, error } = await authClient.auth.getUser(token);
    if (!error && data?.user) {
      user = {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.full_name,
        role: data.user.user_metadata?.role,
      };
    }
  }

  return {
    req,
    res,
    supabase: adminClient,
    user, 
  };
}

// ---------- Type for tRPC context ----------
export type TRPCContext = inferAsyncReturnType<typeof createTRPCContext>;
import { createClient } from "@supabase/supabase-js";
import type { inferAsyncReturnType } from "@trpc/server";

function getUserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function getBearerToken(header?: string) {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" ? token : null;
}

export async function createTRPCContext({ req, res }: { req?: any; res?: any }) {
  const token = getBearerToken(req?.headers?.authorization);
  const userClient = getUserClient();
  const adminClient = getAdminClient();

  let user: { id: string; email: string; name?: string; role?: string } | null = null;

  if (token) {
    const { data, error } = await userClient.auth.getUser(token);
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

export type TRPCContext = inferAsyncReturnType<typeof createTRPCContext>;
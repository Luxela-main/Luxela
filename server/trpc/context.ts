import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { inferAsyncReturnType } from "@trpc/server";
import * as jwt_decode from "jwt-decode";

interface DecodedToken {
  sub: string;
  email?: string;
  exp?: number;
  [key: string]: any;
}

function getAdminClient(): SupabaseClient {
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
  const adminClient = getAdminClient();
  const authHeader = req?.headers?.authorization;
  const token = getBearerToken(authHeader);

  let user: { id: string; email?: string; name?: string; role?: string } | null = null;

  if (token) {
    try {
      const decodeToken = jwt_decode as unknown as <T = any>(token: string) => T;
      const decoded = decodeToken<DecodedToken>(token);

      const { data } = await adminClient.auth.admin.getUserById(decoded.sub);

      if (data.user) {
        user = {
          id: data.user.id,
          email: data.user.email ?? undefined,
          name: data.user.user_metadata?.full_name,
          role: data.user.user_metadata?.role,
        };
      }
    } catch (err) {
      console.warn("Invalid JWT token in request", err);
      user = null;
    }
  }

  return { req, res, supabase: adminClient, user };
}

export type TRPCContext = inferAsyncReturnType<typeof createTRPCContext>;
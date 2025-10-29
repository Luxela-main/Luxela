// server/trpc/context.ts
import { createClient } from '@supabase/supabase-js';
import type { Context } from '../trpc';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getBearerToken(header?: string) {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' ? token : null;
}

export async function createTRPCContext({ req, res }: { req?: any; res?: any }): Promise<Context> {
      console.log("Authorization header:", req?.headers?.authorization);

  const token = getBearerToken(req?.headers?.authorization);
  let user = null;

  if (token) {
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) {
      user = {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.full_name,
        role: data.user.user_metadata?.role,
      };
    } else {
      console.error("Auth error:", error);
    }
  } else {
    console.log("No bearer token found in headers");
  }

  return { req, res, user, session: null };
}

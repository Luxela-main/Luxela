import { createClient } from "@supabase/supabase-js";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";

export async function createTRPCContext({ req, res }: CreateNextContextOptions) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  );

  // Pull the access token from either Authorization header or cookies
  const accessToken =
    req.headers.authorization?.replace("Bearer ", "") ||
    req.cookies["sb-access-token"];

  let user = null;

  // If we have a token → fetch user using the v2-compatible method
  if (accessToken) {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (!error) user = data.user;
  }

  return {
    req,
    res,
    supabase,
    user,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
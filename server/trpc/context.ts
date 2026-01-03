import { createClient } from "@supabase/supabase-js";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";

export async function createTRPCContext({ req, res }: CreateNextContextOptions) {
  // Create the Supabase client with the request so it can read cookies automatically
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: req.headers.authorization ?? "",
        },
      },
    }
  );

  // NEW CORRECT CALL (no arguments)
  const { data: { user }, error } = await supabase.auth.getUser();

  return {
    req,
    res,
    supabase,
    user: error ? null : user,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
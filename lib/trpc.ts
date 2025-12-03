import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { createClient } from "@/utils/supabase/client";
import type { AppRouter } from "@/server";

export const trpc = createTRPCReact<AppRouter>();

export function getTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url:
          process.env.NEXT_PUBLIC_API_URL + "/trpc" ||
          "http://localhost:5000/trpc",
        async headers() {
          const supabase = createClient();
          const {
            data: { session },
          } = await supabase.auth.getSession();

          return {
            authorization: session?.access_token
              ? `Bearer ${session.access_token}`
              : "",
          };
        },
      }),
    ],
  });
}

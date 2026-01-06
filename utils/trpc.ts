import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/server";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""; 
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; 
  return "http://localhost:3000";
};

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      fetch: async (input, init) => {
        const fetchInit: RequestInit = {
          ...init,
          credentials: "include", 
        };


        if (typeof window === "undefined" && init?.headers instanceof Headers === false) {
          fetchInit.headers = {
            ...fetchInit.headers,
           
          };
        }

        return fetch(input, fetchInit);
      },
    }),
  ],
});
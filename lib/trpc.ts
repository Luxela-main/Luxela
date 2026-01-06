import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCProxyClient } from "@trpc/client";
import type { AppRouter } from "@/server";

// Safely compute API URL
const API_URL =
  process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/trpc`
    : "http://localhost:5000/api/trpc";

export const trpc = createTRPCReact<AppRouter>();

export function getTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: API_URL,
        fetch: (input, init) => {
          return fetch(input, {
            ...init,
            credentials: "include",
          });
        },
      }),
    ],
  });
}

export const vanillaTrpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: API_URL,
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          credentials: "include",
        }),
    }),
  ],
});
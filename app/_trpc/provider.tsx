"use client";

import { useState, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "./client";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createClient } from "@/utils/supabase/client";

interface TRPCProviderProps {
  children: ReactNode;
}

// Safe API URL resolver
function getApiUrl() {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (base) return `${base}/api/trpc`;

  return "http://localhost:5000/api/trpc";
}

export function TRCProvider({ children }: TRPCProviderProps) {
  const [queryClient] = useState(() => new QueryClient());
  const apiUrl = getApiUrl();

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),

        httpBatchLink({
          url: apiUrl,

          // Add Supabase bearer token + credentials
          async fetch(input, init) {
            const supabase = createClient();
            const {
              data: { session },
            } = await supabase.auth.getSession();

            return fetch(input, {
              ...init,
              credentials: "include", // FIXED: now in the correct place
              headers: {
                ...(init?.headers || {}),
                authorization: session?.access_token
                  ? `Bearer ${session.access_token}`
                  : "",
                "Content-Type": "application/json",
              },
            });
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
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

            // Convert headers to plain object if it's a Headers instance
            const initHeaders = init?.headers;
            const headerObj: Record<string, string> = {};
            
            if (initHeaders instanceof Headers) {
              initHeaders.forEach((value, key) => {
                headerObj[key] = value;
              });
            } else if (typeof initHeaders === 'object' && initHeaders !== null) {
              Object.assign(headerObj, initHeaders);
            }

            const headers: Record<string, string> = {
              ...headerObj,
              "Content-Type": "application/json",
            };

            // Only add authorization header if we have a valid token
            if (session?.access_token) {
              headers.authorization = `Bearer ${session.access_token}`;
            }

            return fetch(input, {
              ...init,
              credentials: "include",
              headers,
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
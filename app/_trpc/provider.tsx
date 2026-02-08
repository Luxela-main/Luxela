"use client";

import { useState, ReactNode, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "./client";
import { httpLink, loggerLink } from "@trpc/client";
import { createClient } from "@/utils/supabase/client";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

interface TRPCProviderProps {
  children: ReactNode;
}

// Safe API URL resolver
function getApiUrl() {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (base) return `${base}/api/trpc`;

  return "/api/trpc";
}

// Global ref to store current access token from auth state
let currentAccessToken: string | null = null;

async function initializeAuthToken(): Promise<void> {
  const supabase = createClient();

  // Get initial session first
  const { data: { session } } = await supabase.auth.getSession();
  currentAccessToken = session?.access_token ?? null;

  // Subscribe to future changes
  supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
    currentAccessToken = session?.access_token ?? null;
  });
}

export function TRPCProvider({ children }: TRPCProviderProps) {
  const [queryClient] = useState(() => new QueryClient());
  const apiUrl = getApiUrl();
  const [isReady, setIsReady] = useState(false);

  // Initialize auth and TRPC client
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),

        httpLink({
          url: apiUrl,

          // Add Supabase bearer token + credentials
          async fetch(input, init) {
            // Convert headers to plain object if it's a Headers instance
            const initHeaders = init?.headers;
            const headerObj: Record<string, string> = {};

            if (initHeaders instanceof Headers) {
              initHeaders.forEach((value, key) => {
                headerObj[key] = value;
              });
            } else if (typeof initHeaders === "object" && initHeaders !== null) {
              Object.assign(headerObj, initHeaders);
            }

            const headers: Record<string, string> = {
              ...headerObj,
              "Content-Type": "application/json",
            };

            // Use the access token from auth state listener
            if (currentAccessToken) {
              headers.authorization = `Bearer ${currentAccessToken}`;
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

  // Initialize auth on mount BEFORE component renders children
  useEffect(() => {
    initializeAuthToken()
      .then(() => {
        setIsReady(true);
      })
      .catch((error) => {
        console.error('Failed to initialize auth token:', error);
        setIsReady(true); // Still proceed even if auth fails
      });
  }, []);

  // Don't render anything until auth is initialized
  // This ensures ALL requests (including initial ones) have the access token
  if (!isReady) {
    return null;
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
"use client";

import React, { ReactNode, useState, useRef, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { trpc } from "./_trpc/client";
import { httpBatchLink, httpLink, splitLink } from "@trpc/client";
import { createClient } from "@/utils/supabase/client";
import { CartProvider } from "@/modules/cart/context";
import { TRPCReadyProvider } from "@/context/TRPCReadyContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { ListingsProvider } from "@/context/ListingsContext";
import { PendingToastHandler } from "@/components/utils/pending-toast-handler";

const ToastContainer = dynamic(
  () => import("react-toastify").then(mod => ({ default: mod.ToastContainer })),
  { ssr: false, loading: () => null }
);

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 10 * 60 * 1000, // Keep cache for 10 minutes
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  });
}

// Get auth token - fresh on every call to ensure validity
async function getCachedSessionToken() {
  if (typeof window === "undefined") return null;

  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      // Strictly validate and clean token
      let token = String(session.access_token).trim();
      
      // Remove any trailing commas or special characters
      token = token.replace(/[,\s]+$/, '');
      
      // Validate JWT format (should be exactly 3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length === 3 && parts.every(part => part.length > 0)) {
        return token;
      }
    }
  } catch (error) {
    // Silently fail - will use unauthenticated requests
  }
  
  return null;
}

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  const [queryClient] = useState(() => createQueryClient());
  const sessionTokenRef = useRef<string | null>(null);
  const [, setTokenUpdate] = useState(0); // Force re-render on token refresh

  // Update session token periodically and on auth state changes
  useEffect(() => {
    let isMounted = true;

    const updateToken = async () => {
      if (!isMounted) return;
      try {
        const token = await getCachedSessionToken();
        if (isMounted) {
          sessionTokenRef.current = token;
          // Trigger a small re-render to ensure new requests use updated token
          setTokenUpdate(prev => prev + 1);
        }
      } catch (error) {
        console.error('Failed to update session token:', error);
      }
    };

    // Update token immediately on mount
    updateToken();

    // Refresh token every 10 seconds to catch admin role changes
    const refreshInterval = setInterval(updateToken, 10000);

    // Listen for auth state changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      updateToken();
    });

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
      subscription?.unsubscribe();
    };
  }, []);

  // Compute API URL synchronously to ensure it's available for trpcClient creation
  const apiUrl = useMemo(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    if (baseUrl) {
      return `${baseUrl}/api/trpc`;
    }
    return '/api/trpc';
  }, []);

  const [trpcClient] = useState(() => {
    // Get URL synchronously to avoid closure staleness
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const url = baseUrl ? `${baseUrl}/api/trpc` : '/api/trpc';
    
    return trpc.createClient({
      links: [
        // Use splitLink to handle mutations and queries differently
        // This ensures mutations always use POST and never GET
        splitLink({
          // Check if the operation is a mutation
          condition: (op) => op.type === 'mutation',
          // Use regular httpLink for mutations (no batching, always POST)
          true: httpLink({
            url,
            headers() {
              if (sessionTokenRef.current) {
                return { authorization: `Bearer ${sessionTokenRef.current}` };
              }
              return {};
            },
            fetch: (input, init) => {
              // Explicitly ensure POST method for mutations
              return fetch(input, {
                ...init,
                method: 'POST',
                credentials: 'include',
              });
            },
          }),
          // Use batch link for queries (allows GET for caching)
          false: httpBatchLink({
            url,
            headers() {
              if (sessionTokenRef.current) {
                return { authorization: `Bearer ${sessionTokenRef.current}` };
              }
              return {};
            },
            fetch: (input, init) => {
              return fetch(input, {
                ...init,
                credentials: 'include',
              });
            },
          }),
        }),
      ],
    });
  });

  // Memoize the provider structure to prevent unnecessary re-renders
  // Include tokenUpdate in dependency to ensure new client is created when token changes
  const providers = useMemo(() => (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TRPCReadyProvider>
            <ProfileProvider>
              <ListingsProvider>
                <CartProvider>
                  <PendingToastHandler />
                  {children}
                  <ToastContainer
                    position="top-right"
                    autoClose={3000}      
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    pauseOnHover={false}   
                    pauseOnFocusLoss={false}
                    draggable
                    theme="colored"
                  />
                </CartProvider>
              </ListingsProvider>
            </ProfileProvider>
          </TRPCReadyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  ), [trpcClient, queryClient, children]);

  return providers;
}
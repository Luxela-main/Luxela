"use client";

import React, { ReactNode, useState, useRef, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { trpc } from "./_trpc/client";
import { httpBatchLink } from "@trpc/client";
import { createClient } from "@/utils/supabase/client";
import { CartProvider } from "@/modules/cart/context";
import { TRPCReadyProvider } from "@/context/TRPCReadyContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { ListingsProvider } from "@/context/ListingsContext";
import { PendingToastHandler } from "@/components/utils/pending-toast-handler";
import "react-toastify/dist/ReactToastify.css";

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

  // Update session token on mount and when auth changes
  useEffect(() => {
    let isMounted = true;
    
    const updateToken = async () => {
      if (!isMounted) return;
      const token = await getCachedSessionToken();
      if (isMounted && token) {
        sessionTokenRef.current = token;
      }
    };
    
    updateToken();
    
    // Listen for auth state changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      updateToken();
    });
    
    return () => { 
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const apiUrl = useMemo(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    if (baseUrl) {
      return `${baseUrl}/api/trpc`;
    }
    return '/api/trpc';
  }, []);

  const [trpcClient] = useState(() => {
    // Get initial token and update it periodically
    let cachedToken: string | null = null;
    
    const updateToken = async () => {
      try {
        const token = await getCachedSessionToken();
        if (token && typeof token === 'string') {
          // Validate token has exactly 3 parts
          const parts = token.split('.');
          if (parts.length === 3) {
            cachedToken = token;
          }
        }
      } catch (e) {
        // Silently fail
      }
    };
    
    // Update token immediately and then every 30 seconds
    updateToken();
    const interval = setInterval(updateToken, 30000);
    
    return trpc.createClient({
      links: [
        httpBatchLink({
          url: apiUrl,
          headers() {
            // Use cached token to avoid async operations in headers
            if (cachedToken) {
              return { authorization: `Bearer ${cachedToken}` };
            }
            return {};
          },
        }),
      ],
    });
  });

  // Memoize the provider structure to prevent unnecessary re-renders
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
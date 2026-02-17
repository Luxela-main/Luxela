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

// Global session cache to avoid repeated lookups
let cachedSession: { token: string; expiresAt: number } | null = null;
const SESSION_CACHE_TTL = 55000; // 55 seconds (tokens typically last 1 hour)

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

// Get cached auth token without repeated API calls
async function getCachedSessionToken() {
  if (typeof window === "undefined") return null;
  
  const now = Date.now();
  if (cachedSession && cachedSession.expiresAt > now) {
    return cachedSession.token;
  }

  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      cachedSession = {
        token: session.access_token,
        expiresAt: now + SESSION_CACHE_TTL,
      };
      return session.access_token;
    }
  } catch (error) {
    console.warn('[TRPC] Session fetch failed:', error instanceof Error ? error.message : String(error));
  }
  
  return null;
}

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  const [queryClient] = useState(() => createQueryClient());
  const sessionTokenRef = useRef<string | null>(null);
  const [isToastReady, setIsToastReady] = useState(false);

  // Update session token once when component mounts
  useEffect(() => {
    let isMounted = true;
    getCachedSessionToken().then((token) => {
      if (isMounted) {
        sessionTokenRef.current = token;
      }
    });
    
    // Defer toast initialization to avoid blocking render
    const toastTimer = setTimeout(() => {
      if (isMounted) setIsToastReady(true);
    }, 2000);
    
    return () => { 
      isMounted = false;
      clearTimeout(toastTimer);
    };
  }, []);

  const apiUrl = useMemo(() => 
    process.env.NEXT_PUBLIC_API_URL 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/trpc`
      : '/api/trpc',
    []
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: apiUrl,
          async headers() {
            const token = await getCachedSessionToken();
            if (token) {
              return { authorization: `Bearer ${token}` };
            }
            return {};
          },
        }),
      ],
    })
  );

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
                  {isToastReady && (
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
                  )}
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
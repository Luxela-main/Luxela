"use client";

import React, { ReactNode, useState } from "react";
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
  async () => {
    const mod = await import("react-toastify");
    return mod.ToastContainer;
  },
  { ssr: false }
);

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") return createQueryClient();
  if (!browserQueryClient) browserQueryClient = createQueryClient();
  return browserQueryClient;
}

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  const [queryClient] = useState(() => createQueryClient());
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL 
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/trpc`
    : '/api/trpc';
  
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: apiUrl,
          fetch: async (url, options) => {
            // Add 180s timeout for tRPC requests (buffer before 300s Vercel limit)
            // Increased to handle slower batch queries like getApprovedCollections
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 180000);
            
            try {
              const response = await fetch(url, {
                ...options,
                signal: controller.signal,
              });
              return response;
            } catch (error) {
              if (error instanceof TypeError && error.message === 'Failed to fetch') {
                console.error('[tRPC] Network error - Failed to fetch', {
                  url,
                  isAborted: controller.signal.aborted,
                  timestamp: new Date().toISOString(),
                });
              } else if (error instanceof DOMException && error.name === 'AbortError') {
                console.error('[tRPC] Request timeout - Query took longer than 180 seconds', {
                  url,
                  timestamp: new Date().toISOString(),
                });
              }
              throw error;
            } finally {
              clearTimeout(timeoutId);
            }
          },
          async headers() {
            // Only try to access browser APIs in browser environment
            if (typeof window === 'undefined') {
              return {};
            }
            
            try {
              const supabase = createClient();
              // Add a timeout to prevent hanging on session retrieval
              const sessionPromise = supabase.auth.getSession();
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Session retrieval timeout')), 5000)
              );
              
              const { data: { session } } = await Promise.race([
                sessionPromise,
                timeoutPromise as Promise<any>,
              ]);

              if (session?.access_token) {
                console.log('[TRPC-CLIENT] Token found, sending to server');
                return {
                  authorization: `Bearer ${session.access_token}`,
                };
              }
              
              return {};
            } catch (error) {
              // If there's any error accessing auth, return empty headers
              console.warn('[TRPC] Failed to get session:', error instanceof Error ? error.message : String(error));
              return {};
            }
          },
        }),
      ],
    })
  );

  return (
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
  );
}
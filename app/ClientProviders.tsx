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
          async headers() {
            // Only try to access browser APIs in browser environment
            if (typeof window === 'undefined') {
              return {};
            }
            
            try {
              const supabase = createClient();
              const { data: { session } } = await supabase.auth.getSession();

              return {
                authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
              };
            } catch (error) {
              // If there's any error accessing auth, return empty headers
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
"use client";

import React, { ReactNode } from "react";
import dynamic from "next/dynamic";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { trpc } from "@/app/_trpc/client";
import { httpBatchLink } from "@trpc/client";
import "react-toastify/dist/ReactToastify.css";

// Dynamically import ToastContainer to prevent SSR issues
const ToastContainer = dynamic(
  async () => {
    const mod = await import("react-toastify");
    return mod.ToastContainer;
  },
  { ssr: false }
);

// Create a fresh QueryClient
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

// Singleton QueryClient in browser
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
  const queryClient = getQueryClient();

  // Setup TRPC client
  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            headers: {
              ...options?.headers,
              Authorization: `Bearer ${
                typeof window !== "undefined"
                  ? localStorage.getItem("sb-token") ?? ""
                  : ""
              }`,
            },
          });
        },
      }),
    ],
  });

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}

          {/* Single ToastContainer */}
          <ToastContainer
            position="top-right"
            autoClose={3000}      // default 3s
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover={false}   // ensure autoClose works
            pauseOnFocusLoss={false}
            draggable
            theme="colored"
          />
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

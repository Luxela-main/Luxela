"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { trpc } from "./_trpc/client";
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

// Create a fresh query client
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();

  // ---- FIXED tRPC CLIENT ----
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
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            theme="colored"
          />
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
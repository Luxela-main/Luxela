"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { trpc, getTRPCClient } from "@/lib/trpc";
import "react-toastify/dist/ReactToastify.css";

// Dynamically import ToastContainer to prevent SSR issues
const ToastContainer = dynamic(
  async () => {
    const mod = await import("react-toastify");
    return mod.ToastContainer;
  },
  { ssr: false }
);

// Function to create a fresh query client
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });
}

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => makeQueryClient());
  const [trpcClient] = useState(() => getTRPCClient());

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

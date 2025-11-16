"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader } from "@/components/loader/loader";
import { useToast } from "@/components/hooks/useToast";


function AuthCallbackHandler() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const toast = useToast();

  useEffect(() => {
    const isDev = process.env.NODE_ENV === "development";

    const parseFragmentToken = (): string | null => {
      if (typeof window === "undefined") return null;
      try {
        const hash = window.location.hash;
        if (!hash) return null;
        const params = new URLSearchParams(
          hash.startsWith("#") ? hash.slice(1) : hash
        );
        return (
          params.get("access_token") ||
          params.get("token_hash") ||
          params.get("token") ||
          params.get("code") ||
          null
        );
      } catch (err) {
        if (isDev) console.warn("Failed to parse fragment:", err);
        return null;
      }
    };

    const normalizeUser = (data: any): any => {
      if (!data) return null;
      if (data.user) return data.user;
      if (data.session?.user) return data.session.user;
      return null;
    };

    const getRole = (user: any): string => {
      const role = user?.user_metadata?.role ?? user?.role ?? null;
      return typeof role === "string" && role.length > 0 ? role : "buyer";
    };

    const handleCallback = async () => {
      const code = searchParams.get("code")?.trim() || null;
      const type = searchParams.get("type")?.trim() || null;
      const fragToken = parseFragmentToken();
      const tokenHash = fragToken || searchParams.get("token_hash");

      if (isDev) {
        console.log("Auth callback params:", {
          code,
          type,
          tokenHash,
          url: typeof window !== "undefined" ? window.location.href : null,
        });
      }

      try {
        // Google / OAuth flow
        if (code) {
          const { data } = await supabase.auth.exchangeCodeForSession(code);
          if (code || !data?.session) {
            if (isDev) toast.success("Signup successful!");
            router.replace("/");
            return;
          }
        }

        // Email verification / signup flow
        if (type === "signup" && tokenHash) {
          const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            type: "signup",
            token_hash: tokenHash,
          });

          if (verifyError) {
            console.error("verifyOtp failed:", verifyError);
            router.replace("/signin?error=verification_failed");
            return;
          }

          const user = normalizeUser(verifyData);
          const role = getRole(user);
          toast.success("Signup successful!");

          router.replace(role === "seller" ? "/sellers/dashboard" : "/buyer");
          return;
        }

        // If already logged in (rare fallback)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const user = normalizeUser({ session });
          const role = getRole(user);
          toast.success("Signup successful!");
          router.replace(role === "seller" ? "/sellers/dashboard" : "/buyer");
          return;
        }

        // No valid token/code found
        if (isDev) console.error("Missing code or token_hash in callback URL.");
        router.replace("/signin?error=missing_token");
      } catch (err) {
        console.error("Unexpected error during auth callback:", err);
        router.replace("/signin?error=unexpected");
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchParams, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader />
      </div>
    );
  }

  return null;
}

/**
 * Everything wrapped in a Suspense boundary
 */
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-black">
          <Loader />
        </div>
      }
    >
      <AuthCallbackHandler />
    </Suspense>
  );
}
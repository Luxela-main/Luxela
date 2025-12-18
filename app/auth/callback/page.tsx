"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader } from "@/components/loader/loader";
import { useToast } from "@/components/hooks/useToast";

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const toast = useToast();
  const isDev = process.env.NODE_ENV === "development";

  const getUserFromSession = (session: any) => session?.user ?? null;
  const getRoleFromUser = (user: any): "buyer" | "seller" | null =>
    user?.user_metadata?.role || null;

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const type = searchParams.get("type");
        const tokenHash = searchParams.get("token_hash");

        if (isDev) console.log("Auth callback params:", { code, type, tokenHash });

        if (code) {
          const { data } = await supabase.auth.exchangeCodeForSession(code);
          if (data?.session) {
            const user = getUserFromSession(data.session);
            const role = getRoleFromUser(user);
            if (isDev) toast.success("Signin successful!");
            if (role) {
              router.replace(role === "seller" ? "/sellers/dashboard" : "/buyer/profile");
            } else {
              router.replace("/dashboard");
            }
            return;
          } else {
            router.replace("/dashboard");
            return;
          }
        }

        if (type === "signup" && tokenHash) {
          const { data, error } = await supabase.auth.verifyOtp({ type: "signup", token_hash: tokenHash });
          if (error || !data.session) {
            router.replace("/signin?error=verification_failed");
            return;
          }
          const user = getUserFromSession(data.session);
          const role = getRoleFromUser(user);
          toast.success("Signup verified successfully.");
          if (role) {
            router.replace(role === "seller" ? "/sellers/dashboard" : "/buyer/profile");
          } else {
            router.replace("/dashboard");
          }
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const role = getRoleFromUser(session.user);
          if (role) {
            router.replace(role === "seller" ? "/sellers/dashboard" : "/buyer/profile");
          } else {
            router.replace("/dashboard");
          }
          return;
        }

        if (isDev) console.error("Invalid auth callback state.");
        router.replace("/signin?error=invalid_callback");
      } catch (err) {
        console.error("Auth callback fatal error:", err);
        router.replace("/signin?error=unexpected");
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <Loader />
    </div>
  );
}

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
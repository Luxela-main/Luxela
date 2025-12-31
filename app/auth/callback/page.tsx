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

  // Central redirect logic
  const redirectUser = (user: any) => {
    const role = user?.user_metadata?.role;

    // NO ROLE
    if (!role) {
      router.replace("/select-role");
      return;
    }

    // EXISTING USERS
    if (role === "seller") {
      router.replace("/sellers/dashboard");
    } else {
      router.replace("/buyer/profile");
    }
  };

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const type = searchParams.get("type");
        const tokenHash = searchParams.get("token_hash");

        /**
         * GOOGLE / OAUTH CALLBACK
         */
        if (code) {
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error || !data.session) {
            router.replace("/signin?error=oauth_failed");
            return;
          }

          toast.success("Signed in successfully.");
          redirectUser(data.session.user);
          return;
        }

        /**
         * EMAIL OTP SIGNUP VERIFICATION
         */
        if (type === "signup" && tokenHash) {
          const { data, error } = await supabase.auth.verifyOtp({
            type: "signup",
            token_hash: tokenHash,
          });

          if (error || !data.session) {
            router.replace("/signin?error=verification_failed");
            return;
          }

          toast.success("Signup verified successfully.");
          redirectUser(data.session.user);
          return;
        }

        /**
         * EXISTING SESSION (REFRESH / DIRECT VISIT)
         */
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          redirectUser(session.user);
          return;
        }

        router.replace("/signin?error=invalid_callback");
      } catch (error) {
        console.error("Auth callback error:", error);
        router.replace("/signin?error=unexpected");
      }
    };

    handleCallback();
  }, [router, searchParams, supabase, toast]);

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

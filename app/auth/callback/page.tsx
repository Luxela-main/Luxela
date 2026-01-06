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

  // Check if user profile exists
  const checkProfile = async (role: "buyer" | "seller") => {
    const res = await fetch(`/api/profile/check?role=${role}`);
    const data = await res.json();
    return data?.exists === true;
  };

  // Central redirect logic
  const redirectUser = async (user: any) => {
    const role = user?.user_metadata?.role as "buyer" | "seller" | undefined;

    // No role set → route to role selection
    if (!role) {
      router.replace("/select-role");
      return;
    }

    // Check via API (fast)
    const exists = await checkProfile(role);

    // If buyer
    if (role === "buyer") {
      if (exists) {
        router.replace("/buyer/profile");
        return;
      }
      router.replace("/buyer/profile/create");
      return;
    }

    // If seller
    if (role === "seller") {
      if (exists) {
        router.replace("/sellers/dashboard");
        return;
      }
      router.replace("/sellersAccountSetup");
      return;
    }

    // Fallback
    router.replace("/select-role");
  };

  // Main callback effect
  useEffect(() => {
    const run = async () => {
      try {
        const code = searchParams.get("code");
        const type = searchParams.get("type");
        const tokenHash = searchParams.get("token_hash");

        // OAuth sign-in using code
        if (code) {
          const { data } = await supabase.auth.exchangeCodeForSession(code);

          if (type === "signup" && data.session?.user) {
            toast.success("Account created successfully.");
            router.replace("/select-role");
            return;
          }

          if (data.session?.user) {
            toast.success("Signed in successfully.");
          }
        }

        // OTP verification (email link)
        if (tokenHash && type === "signup") {
          const { data, error } = await supabase.auth.verifyOtp({
            type: "signup",
            token_hash: tokenHash,
          });

          if (error || !data.session) {
            router.replace("/signin?error=verification_failed");
            return;
          }

          toast.success("Signup verified.");
          await redirectUser(data.session.user);
          return;
        }

        // Final fallback: check active session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          await redirectUser(session.user);
          return;
        }

        router.replace("/signin?error=invalid_callback");
      } catch (err) {
        console.error("Callback error:", err);
        router.replace("/signin?error=unexpected");
      }
    };

    run();
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <Loader />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Loader />}>
      <AuthCallbackHandler />
    </Suspense>
  );
}
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

  const checkProfile = async (role: "buyer" | "seller") => {
    const res = await fetch(`/api/profile/check?role=${role}`);
    const data = await res.json();
    return data?.exists === true;
  };

  const redirectUser = async (user: any) => {
    const role = user?.user_metadata?.role;

    if (!role) {
      router.replace("/select-role");
      return;
    }

    const exists = await checkProfile(role);

    if (!exists) {
      router.replace(role === "buyer"
        ? "/buyer/profile/create"
        : "/sellersAccountSetup"
      );
      return;
    }

    router.replace(role === "seller"
      ? "/sellers/dashboard"
      : "/buyer/profile"
    );
  };

  useEffect(() => {
    const run = async () => {
      try {
        const code = searchParams.get("code");
        const type = searchParams.get("type");
        const tokenHash = searchParams.get("token_hash");

        // OAuth 
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

        // OTP (email confirmation)
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

        // Final session check
        const { data: { session } } = await supabase.auth.getSession();

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
"use client";

export const dynamic = 'force-dynamic';

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader } from "@/components/loader/loader";
import { useToast } from "@/components/hooks/useToast";
import { useAuth } from "@/context/AuthContext";
import { checkAdminStatus } from "@/app/actions/admin";

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supabase, setUser } = useAuth();
  const toast = useToast();

  const checkProfile = async (role: "buyer" | "seller") => {
    try {
      const res = await fetch(`/api/profile/check`, {
        credentials: "include",
      });
      if (!res.ok) {
        try {
          const errorData = await res.json();
          console.error("[AuthCallback] Profile check failed with status", res.status, "Response:", errorData);
        } catch {
          console.error("[AuthCallback] Profile check failed with status", res.status, "Could not parse response");
        }
        return { exists: false, profileComplete: false };
      }
      const data = await res.json();
      console.log("[AuthCallback] Profile check successful:", data);
      return {
        exists: data?.exists === true,
        profileComplete: data?.profileComplete === true,
        role: data?.role,
      };
    } catch (err) {
      console.error("[AuthCallback] Profile check error:", err);
      return { exists: false, profileComplete: false };
    }
  };

  const redirectUser = async (user: any) => {
    const role = user?.user_metadata?.role as "buyer" | "seller" | undefined;
    const customRedirect = searchParams.get("redirect");

    // Store success toast to display after redirect
    localStorage.setItem('pendingToast', JSON.stringify({ type: 'success', message: 'Signed in successfully.' }));

    // If custom redirect is specified (e.g., from admin signin with Google)
    if (customRedirect) {
      // If it's an admin redirect, just use it as-is (admin flow will handle role validation)
      if (customRedirect.includes('/admin')) {
        window.location.href = customRedirect;
        return;
      }
      // Otherwise use the custom redirect
      window.location.href = customRedirect;
      return;
    }

    if (!role) {
      window.location.href = "/select-role";
      return;
    }

    const profileData = await checkProfile(role);

    // If buyer
    if (role === "buyer") {
      if (!profileData.exists) {
        window.location.href = "/buyer/profile/create";
        return;
      }

      if (!profileData.profileComplete) {
        window.location.href = "/buyer/profile/create";
        return;
      }

      window.location.href = "/buyer/dashboard";
      return;
    }

    // If seller
    if (role === "seller") {
      if (!profileData.exists) {
        window.location.href = "/sellersAccountSetup";
        return;
      }

      if (!profileData.profileComplete) {
        window.location.href = "/sellersAccountSetup";
        return;
      }

      window.location.href = "/sellers/dashboard";
      return;
    }

    // Fallback
    window.location.href = "/select-role";
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
            setUser(data.session.user);
            // Store toast message to show after redirect
            localStorage.setItem('pendingToast', JSON.stringify({ type: 'success', message: 'Account created successfully.' }));
            window.location.href = "/select-role";
            return;
          }

          if (data.session?.user) {
            setUser(data.session.user);
            // Store toast message to show after redirect
            localStorage.setItem('pendingToast', JSON.stringify({ type: 'success', message: 'Signed in successfully.' }));
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

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          
          // Check if this is admin signin (by looking at custom redirect param)
          const customRedirect = searchParams.get("redirect");
          if (customRedirect?.includes("/admin")) {
            await redirectUser(session.user);
            return;
          }

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
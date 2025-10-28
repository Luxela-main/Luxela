"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Grab code and type from URL
        const code = searchParams.get("code");
        const type = searchParams.get("type"); // e.g., 'signup', 'recovery', etc.

        if (!code) {
          router.replace("/signin");
          return;
        }

        // Exchange code for session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("Verification failed:", error);
          router.replace("/signin?error=verification_failed");
          return;
        }

        // User is now signed in
        const redirect = searchParams.get("redirect") || "/";
        router.replace(redirect);
      } catch (err) {
        console.error("Unexpected error:", err);
        router.replace("/signin?error=unexpected_error");
      }
    };

    handleCallback();
  }, [router, supabase, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a] text-white">
      <p className="text-lg animate-pulse">Verifying your account...</p>
    </div>
  );
}

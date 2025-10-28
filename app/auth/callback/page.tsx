"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const supabase = createClient();

  useEffect(() => {
    const verifyEmail = async () => {
      if (!code) {
        router.replace("/signin");
        return;
      }

      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("Verification failed:", error);
          router.replace("/signin?error=verification_failed");
          return;
        }

        
        router.replace("/verify-email");
      } catch (err) {
        console.error("Unexpected error:", err);
        router.replace("/signin?error=unexpected_error");
      }
    };

    verifyEmail();
  }, [code, router, supabase]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a] text-white">
      <p className="text-lg">Verifying your email...</p>
    </div>
  );
}

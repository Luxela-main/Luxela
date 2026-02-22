"use client";

import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/hooks/useToast";

interface GoogleSignInButtonProps {
  redirectPath?: string;
}

export default function GoogleSignInButton({ redirectPath }: GoogleSignInButtonProps = {}) {
  const toast = useToast();
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    try {
      if (redirectPath) {
        sessionStorage.setItem('authRedirectPath', redirectPath);
      }

      const redirectUrl = `${window.location.origin}/api/auth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error("[GoogleSignIn] OAuth error:", error);
        throw error;
      }

      if (data?.url) {
        console.log("[GoogleSignIn] Redirecting to Google OAuth URL");
        window.location.href = data.url;
      } else {
        throw new Error("No OAuth URL returned from Supabase");
      }
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      
      const errorMessage = err?.message || "Failed to sign in with Google";
      if (errorMessage.includes("PKCE") || errorMessage.includes("code_verifier")) {
        toast.error(
          "Session expired. Please try signing in again. If you cleared your browser cache, this is expected."
        );
      } else if (errorMessage.includes("code") || errorMessage.includes("OAuth")) {
        toast.error("OAuth authentication failed. Please try again.");
      } else {
        toast.error("Failed to sign in with Google. Try again.");
      }
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="w-full flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 py-2 rounded text-sm text-white transition-colors cursor-pointer"
    >
      <Image src="/google.svg" alt="Google" width={16} height={16} />
      Continue with Google
    </button>
  );
}
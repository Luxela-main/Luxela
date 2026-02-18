"use client";

import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/hooks/useToast";

interface GoogleSignInButtonProps {
  redirectPath?: string; // Optional custom redirect path
}

export default function GoogleSignInButton({ redirectPath }: GoogleSignInButtonProps = {}) {
  const toast = useToast();
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    try {
      // OAuth callback MUST point to the server API route, not the client page
      // Google's OAuth server will POST to this endpoint with the auth code
      const redirectUrl = `${window.location.origin}/api/auth/callback`;
      
      // Store the custom redirect path in sessionStorage if provided
      if (redirectPath) {
        sessionStorage.setItem('authRedirectPath', redirectPath);
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });

      if (error) throw error;

      // If Supabase provides a URL, redirect
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      toast.error("Failed to sign in with Google. Try again.");
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
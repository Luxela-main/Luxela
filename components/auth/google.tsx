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
      // Determine the correct callback URL
      const callbackPath = redirectPath ? `/auth/callback?redirect=${encodeURIComponent(redirectPath)}` : `/auth/callback`;
      const redirectUrl = `${window.location.origin}${callbackPath}`;

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
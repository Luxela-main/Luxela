"use client";

import { createClient } from "@/utils/supabase/client";

export default function GoogleSignInButton() {
  const supabase = createClient();

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
    if (error) console.error(error);
  };

  return (
    <button
      className="w-full flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 py-2 rounded text-sm"
      onClick={handleSignIn}
    >
      <img src="/google.svg" alt="Google" className="h-4 w-4" />
      Sign in with Google
    </button>
  );
}

"use client";

import { createClient } from "../../utils/supabase/client";

export async function signInWithGoogle(
  priceId?: string,
  discountCode?: string,
  redirect: string = "/"
) {
  const supabase = createClient();
  const redirectTo = `${window.location.origin}/api/auth/callback`;

  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${redirectTo}?priceId=${encodeURIComponent(priceId || "")}
                               &discountCode=${encodeURIComponent(discountCode || "")}
                               &redirect=${encodeURIComponent(redirect)}`,
    },
  });
}

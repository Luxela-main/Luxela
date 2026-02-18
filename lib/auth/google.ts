"use client";

import { createClient } from "../../utils/supabase/client";

export async function signInWithGoogle(
  priceId?: string,
  discountCode?: string,
  redirect: string = "/"
) {
  const supabase = createClient();
  // OAuth callback MUST point to the server API route
  // Google's OAuth server will POST to this endpoint with the auth code
  const apiCallbackUrl = `${window.location.origin}/api/auth/callback`;
  
  // Pass additional parameters via query string
  const params = new URLSearchParams();
  if (priceId) params.set('priceId', priceId);
  if (discountCode) params.set('discountCode', discountCode);
  if (redirect) params.set('redirect', redirect);

  const redirectTo = params.toString() ? `${apiCallbackUrl}?${params.toString()}` : apiCallbackUrl;

  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });
}
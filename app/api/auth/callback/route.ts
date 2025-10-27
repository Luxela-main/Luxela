import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const encodedRedirectTo =
    requestUrl.searchParams.get("redirect") || "/buyer/profile";
  const priceId = decodeURIComponent(
    requestUrl.searchParams.get("priceId") || ""
  );
  const discountCode = decodeURIComponent(
    requestUrl.searchParams.get("discountCode") || ""
  );
  const redirectTo = decodeURIComponent(encodedRedirectTo);

  // Create Supabase server client (your existing util)
  const supabase = await createClient();

  if (code) {
    // Exchange OAuth code for a session (sets cookies automatically)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging OAuth code:", error.message);
      return NextResponse.redirect(
        new URL("/signin?error=auth_failed", request.url)
      );
    }

    console.log("User authenticated:", data.user?.email);
  }

  // (Optional) handle special logic for checkout or discount
  if (priceId) {
    // e.g. await createCheckoutSession({ priceId, discountCode });
  }

  // Redirect after successful login
  return NextResponse.redirect(new URL(redirectTo, request.url));
}

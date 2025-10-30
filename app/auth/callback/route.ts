import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const origin = requestUrl.origin;

  console.log("=== SERVER CALLBACK ===");
  console.log("Code:", code);
  console.log("Token hash:", token_hash);
  console.log("Type:", type);

  // Handle OAuth callback
  if (code) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Exchange error:", error);
      return NextResponse.redirect(`${origin}/signin?error=auth_failed`);
    }

    if (data?.user) {
      console.log("User authenticated:", data.user.email);
      const role =
        data.user.user_metadata?.role || data.user.app_metadata?.role;

      // If user has no role (first-time Google sign-in), redirect to role selection
      if (!role) {
        return NextResponse.redirect(`${origin}/select-role`);
      }

      if (role === "buyer") {
        return NextResponse.redirect(`${origin}/buyer/profile`);
      } else if (role === "seller") {
        return NextResponse.redirect(`${origin}/seller/dashboard`);
      }

      return NextResponse.redirect(`${origin}/`);
    }
  }

  // Handle email verification
  if (token_hash && type === "signup") {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: "signup",
    });

    if (error) {
      console.error("Verification error:", error);
      return NextResponse.redirect(
        `${origin}/signin?error=verification_failed`
      );
    }

    return NextResponse.redirect(`${origin}/verify-email?verified=success`);
  }

  // No valid parameters
  return NextResponse.redirect(`${origin}/signin?error=missing_parameters`);
}

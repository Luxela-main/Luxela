import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const encodedRedirectTo = requestUrl.searchParams.get("redirect") || "/app";
  const priceId = decodeURIComponent(
    requestUrl.searchParams.get("priceId") || ""
  );
  const discountCode = decodeURIComponent(
    requestUrl.searchParams.get("discountCode") || ""
  );
  const redirectTo = decodeURIComponent(encodedRedirectTo);

  const supabase = await createClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
      const { data: { user } } = await supabase.auth.getUser();
      console.log("User:", user);


    // await getOrCreateUserAvatar(userData);
  }
  // Set session cookie
  if (priceId && priceId !== "") {
    // await createCheckoutSession({ priceId, discountCode });
  } else {
    return NextResponse.redirect(`${requestUrl.origin}${redirectTo}`);
  }

  // Successful authentication, redirect to the intended page
  // Ensure we're using the correct origin
}
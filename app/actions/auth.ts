"use server";

import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/* Map Supabase Error Messages */
function mapAuthError(error: any): string {
  if (!error?.message) return "Unknown error occurred.";

  const msg = String(error.message).toLowerCase();

  if (msg.includes("invalid login credentials"))
    return "Incorrect email or password.";

  if (msg.includes("email not confirmed"))
    return "Email not verified. Please check your inbox.";

  if (msg.includes("user already registered"))
    return "Email already registered. Please sign in instead.";

  if (msg.includes("weak password"))
    return "Password too weak. Use a stronger one.";

  return error.message || "Authentication error.";
}

/*  Upsert user into `users` table */
async function insertUserToDB(supabase: SupabaseClient, user: any) {
  if (!user?.id || !user?.email) return;

  await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || "buyer",
      full_name: user.user_metadata?.full_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
    },
    { onConflict: "id" }
  );
}

/* Signup */
export async function signupAction(
  email: string,
  password: string,
  role: "buyer" | "seller"
) {
  try {
    const supabase = await createClient();
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role }, emailRedirectTo: redirectUrl },
    });

    if (error)
      return { success: false, error: mapAuthError(error) };

    if (data.user) await insertUserToDB(supabase, data.user);

    return {
      success: true,
      message: "Signup successful. Check your email for verification.",
    };
  } catch (err: any) {
    return { success: false, error: mapAuthError(err) };
  }
}

/* Verify signup token  */
export async function verifySignupToken(token_hash: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      type: "signup",
      token_hash,
    });

    if (error)
      return { success: false, error: mapAuthError(error) };

    if (data.user) await insertUserToDB(supabase, data.user);

    return { success: true, session: data.session };
  } catch (err: any) {
    return { success: false, error: mapAuthError(err) };
  }
}

/*  Signin  */
export async function signinAction(email: string, password: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error)
      return { success: false, error: mapAuthError(error) };

    if (data.user) await insertUserToDB(supabase, data.user);

    return { success: true, session: data.session, user: data.user };
  } catch (err: any) {
    return { success: false, error: mapAuthError(err) };
  }
}

/* Google OAuth */
export async function signinWithGoogleAction() {
  try {
    const supabase = await createClient();
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=google`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl },
    });

    if (error)
      return { success: false, error: mapAuthError(error) };

    return { success: true, url: data.url };
  } catch (err: any) {
    return { success: false, error: mapAuthError(err) };
  }
}

/*  Resend Verification */
export async function resendVerificationAction(email: string) {
  try {
    const supabase = await createClient();
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=signup`;

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: redirectUrl },
    });

    if (error)
      return { success: false, error: mapAuthError(error) };

    return {
      success: true,
      message: "Verification email resent successfully.",
    };
  } catch (err: any) {
    return { success: false, error: mapAuthError(err) };
  }
}

/*  Signout */
export async function signoutAction() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error)
      return { success: false, error: mapAuthError(error) };

    return { success: true };
  } catch (err: any) {
    return { success: false, error: mapAuthError(err) };
  }
}
"use server";

import { createClient } from "@/utils/supabase/server";

function mapAuthError(error: any): string {
  if (!error?.message) return "Unknown authentication error.";
  const msg = String(error.message).toLowerCase();

  if (msg.includes("invalid login credentials")) return "Incorrect email or password.";
  if (msg.includes("email not confirmed")) return "Email not verified. Please check your inbox.";
  if (msg.includes("user already registered")) return "Email already registered. Please sign in instead.";
  if (msg.includes("weak password")) return "Password too weak. Please choose a stronger password.";

  return error.message;
}

export async function signupAction(email: string, password: string, role: "buyer" | "seller") {
  try {
    const supabase = await createClient();
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role }, emailRedirectTo: redirectUrl },
    });

    if (error) return { success: false, error: mapAuthError(error) };

    return { success: true, message: "Signup successful. Please check your email to verify." };
  } catch (err: any) {
    return { success: false, error: mapAuthError(err) };
  }
}

export async function verifySignupToken(token_hash: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ type: "signup", token_hash });

    if (error) return { success: false, error: mapAuthError(error) };

    return { success: true, session: data.session ?? null, user: data.user ?? null };
  } catch (err: any) {
    return { success: false, error: mapAuthError(err) };
  }
}

export async function signinAction(email: string, password: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return { success: false, error: mapAuthError(error) };

    return { success: true, session: data.session ?? null, user: data.user ?? null };
  } catch (err: any) {
    return { success: false, error: mapAuthError(err) };
  }
}

export async function signinWithGoogleAction() {
  try {
    const supabase = await createClient();
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=google`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl },
    });

    if (error) return { success: false, error: mapAuthError(error) };

    return { success: true, url: data.url };
  } catch (err: any) {
    return { success: false, error: mapAuthError(err) };
  }
}

export async function resendVerificationAction(email: string) {
  try {
    const supabase = await createClient();
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

    const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: redirectUrl } });

    if (error) return { success: false, error: mapAuthError(error) };

    return { success: true, message: "Verification email resent successfully." };
  } catch (err: any) {
    return { success: false, error: mapAuthError(err) };
  }
}

export async function signoutAction() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) return { success: false, error: mapAuthError(error) };

    return { success: true };
  } catch (err: any) {
    return { success: false, error: mapAuthError(err) };
  }
}
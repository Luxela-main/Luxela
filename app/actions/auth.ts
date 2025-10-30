"use server";

import { createClient } from "@/utils/supabase/server";

function mapAuthError(error: any): Error {
  if (!error?.message) return new Error("An unknown error occurred.");
  const msg = error.message.toLowerCase();

  if (msg.includes("invalid login credentials"))
    return new Error("Incorrect email or password.");
  if (msg.includes("email not confirmed"))
    return new Error("Your email is not verified. Please check your inbox.");
  if (msg.includes("user already registered"))
    return new Error(
      "This email is already registered. Please sign in instead."
    );
  if (msg.includes("weak password"))
    return new Error("Password too weak. Use a stronger one.");
  if (msg.includes("expired"))
    return new Error("Your verification link has expired. Please try again.");

  return new Error(error.message);
}

/**
 * Sign up user (with email confirmation)
 */
export async function signupAction(
  email: string,
  password: string,
  role: string
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role }, 
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=signup`,
      },
    });

    if (error) throw error;

    return {
      success: true,
      data,
      message: "Please check your email to confirm your account.",
    };
  } catch (err) {
    throw mapAuthError(err);
  }
}

/**
 * Sign in user
 */
export async function signinAction(email: string, password: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Check if user has a role
    const role =
      data.user?.user_metadata?.role || data.user?.app_metadata?.role;

    return {
      success: true,
      data,
      needsRole: !role, // Flag to indicate if role selection is needed
    };
  } catch (err) {
    throw mapAuthError(err);
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationAction(email: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) throw error;

    return {
      success: true,
      message: "Verification email resent successfully.",
    };
  } catch (err) {
    throw mapAuthError(err);
  }
}

/**
 * Sign out user
 */
export async function signoutAction() {
  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (err) {
    throw mapAuthError(err);
  }
}

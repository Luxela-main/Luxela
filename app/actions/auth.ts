"use server";

import { createClient } from "@/utils/supabase/server";

function mapAuthError(error: any): string {
  if (!error?.message) return "Unknown authentication error.";
  const msg = String(error.message).toLowerCase();

  if (msg.includes("invalid login credentials")) return "Incorrect email or password.";
  if (msg.includes("email not confirmed")) return "Email not verified. Please check your inbox.";
  if (msg.includes("user already registered") || msg.includes("already registered") || msg.includes("duplicate") || msg.includes("user already exists")) {
    return "Email already registered. Please sign in instead.";
  }
  if (msg.includes("weak password")) return "Password too weak. Please choose a stronger password.";

  return error.message;
}

// Check if an email already exists in Supabase Auth
async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    // Try to sign in with the email and a dummy password
    // If error is "Invalid login credentials", the email exists (wrong password)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: "check-only-dummy-password",
    });

    // "Invalid login credentials" = user exists but wrong password
    if (error?.message?.includes("Invalid login credentials")) {
      return true;
    }

    return false;
  } catch (err: any) {
    return false;
  }
}

export async function signupAction(email: string, password: string, role: "buyer" | "seller") {
  try {
    const supabase = await createClient();
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`;

    // CRITICAL: Check if email already exists BEFORE attempting signup
    // This prevents the modal from showing for duplicate emails
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      return { success: false, error: "Email already registered. Please sign in instead.", isNewSignup: false };
    }

    // Now proceed with signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role }, emailRedirectTo: redirectUrl },
    });

    if (error) return { success: false, error: mapAuthError(error), isNewSignup: false };

    // If we got here, it's definitely a new signup (we already checked email doesn't exist)
    return { success: true, message: "Signup successful. Please check your email to verify.", isNewSignup: true };
  } catch (err: any) {
    return { success: false, error: mapAuthError(err), isNewSignup: false };
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
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`;

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
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`;

    const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: redirectUrl } });

    if (error) return { success: false, error: mapAuthError(error) };

    return { success: true, message: "Verification email resent successfully." };
  } catch (err: any) {
    return { success: false, error: mapAuthError(err) };
  }
}

export async function forgotPasswordAction(email: string) {
  try {
    const supabase = await createClient();
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) return { success: false, error: mapAuthError(error) };

    return { success: true, message: "Password reset email sent. Check your inbox." };
  } catch (err: any) {
    return { success: false, error: mapAuthError(err) };
  }
}

export async function resetPasswordAction(password: string, token: string) {
  try {
    const supabase = await createClient();

    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash: token,
    });

    if (verifyError) return { success: false, error: mapAuthError(verifyError) };

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) return { success: false, error: mapAuthError(updateError) };

    return { success: true, message: "Password updated successfully. Please sign in." };
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
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

export async function checkEmailRegistration(email: string) {
  try {
    const supabase = await createClient();
    const normalizedEmail = email.toLowerCase().trim();

    const {
      data: { users },
      error: authError,
    } = await supabase.auth.admin.listUsers();

    if (!authError && users) {
      const existingUser = users.find(
        (u: any) => u.email?.toLowerCase() === normalizedEmail
      );

      if (existingUser) {
        const role = existingUser.user_metadata?.role as
          | "buyer"
          | "seller"
          | undefined;

        return {
          exists: true,
          role: role || "user",
          message: `This email is already registered as a ${role || "user"}. Please sign in instead.`,
        };
      }
    }

    return { exists: false };
  } catch (err: any) {
    console.error("Email registration check error:", err);
    return { exists: null, error: "Failed to check email availability" };
  }
}
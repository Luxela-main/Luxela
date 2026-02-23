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


export async function signupAction(email: string, password: string, role: "buyer" | "seller") {
  try {
    const supabase = await createClient();
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`;

    // Proceed with signup - Supabase will validate if email already exists
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role }, emailRedirectTo: redirectUrl },
    });

    // Handle any signup errors
    if (error) {
      // Determine if this is a duplicate email error
      const mappedError = mapAuthError(error);
      const isDuplicateEmail = mappedError.includes("already registered");
      return { success: false, error: mappedError, isNewSignup: !isDuplicateEmail };
    }

    // If we got here, signup was successful
    return { success: true, message: "Signup successful. Please check your email to verify.", isNewSignup: true };
  } catch (err: any) {
    const mappedError = mapAuthError(err);
    const isDuplicateEmail = mappedError.includes("already registered");
    return { success: false, error: mappedError, isNewSignup: !isDuplicateEmail };
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

export async function adminSigninAction(email: string, adminPassword: string) {
  try {
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    
    if (!ADMIN_PASSWORD) {
      return { success: false, error: "Admin password not configured on server" };
    }
    
    // Verify admin password
    if (adminPassword !== ADMIN_PASSWORD) {
      return { success: false, error: "Invalid admin password" };
    }
    
    const supabase = await createClient();
    
    // Check if email exists and get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, role, email')
      .eq('email', email.toLowerCase())
      .single();
    
    // Email doesn't exist in users table
    if (userError || !userData) {
      return { 
        success: false, 
        error: "Email not found. Please sign up first or check your email address." 
      };
    }
    
    // Check if user is an admin
    const isAdmin = userData.role === 'admin';
    
    if (!isAdmin) {
      return { 
        success: false, 
        error: "This email does not have admin privileges." 
      };
    }
    
    // Get the current session for the authenticated user
    const { data: authData } = await supabase.auth.getUser();
    
    return { 
      success: true, 
      user: authData.user ?? null,
      isAdmin: true,
      message: "Admin verified successfully"
    };
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
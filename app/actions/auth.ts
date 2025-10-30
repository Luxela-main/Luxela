"use server";

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_BASE_URL || "https://luxela-3s8u.onrender.com";

function mapAuthError(error: any): Error {
  if (!error?.message) return new Error("An unknown error occurred.");
  const msg = String(error.message || "").toLowerCase();

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

  return new Error(error.message || "Authentication error");
}

/**
 * Sign up user (delegated to backend)
 */
export async function signupAction(
  email: string,
  password: string,
  role: string
) {
  try {
    const res = await fetch(`${AUTH_BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Sign up failed");

    return {
      success: true,
      data,
      message: data?.message || "Please check your email to confirm your account.",
    };
  } catch (err: any) {
    throw mapAuthError(err);
  }
}

/**
 * Sign in user (delegated to backend)
 */
export async function signinAction(email: string, password: string) {
  try {
    const res = await fetch(`${AUTH_BASE_URL}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Invalid email or password");

    return {
      success: true,
      data,
      needsRole: false,
    };
  } catch (err: any) {
    throw mapAuthError(err);
  }
}

/**
 * Resend verification email (delegated to backend)
 */
export async function resendVerificationAction(email: string) {
  try {
    const res = await fetch(`${AUTH_BASE_URL}/api/auth/resend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to resend email");

    return {
      success: true,
      message: data?.message || "Verification email resent successfully.",
    };
  } catch (err: any) {
    throw mapAuthError(err);
  }
}

/**
 * Sign out (delegated to backend if needed)
 */
export async function signoutAction() {
  try {
    // If the backend exposes a signout endpoint
    await fetch(`${AUTH_BASE_URL}/api/auth/signout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    return { success: true };
  } catch (err: any) {
    throw mapAuthError(err);
  }
}

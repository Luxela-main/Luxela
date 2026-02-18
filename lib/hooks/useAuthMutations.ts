"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

// -----------------------------
// Error Mapping
// -----------------------------
function mapAuthError(error: any): Error {
  if (!error?.message) return new Error("An unknown error occurred.");
  const msg = String(error.message || "").toLowerCase();

  if (msg.includes("invalid login credentials"))
    return new Error("Incorrect email or password.");
  if (msg.includes("email not confirmed"))
    return new Error("Your email is not verified. Please check your inbox.");
  if (msg.includes("user already registered"))
    return new Error("This email is already registered. Please sign in instead.");
  if (msg.includes("weak password"))
    return new Error("Password too weak. Use a stronger one.");
  if (msg.includes("expired"))
    return new Error("Your verification link has expired. Please try again.");

  return new Error(error.message || "Authentication error");
}

// -----------------------------
// Types
// -----------------------------
interface SignupRequest {
  email: string;
  password: string;
  role: "buyer" | "seller";
}

interface SigninRequest {
  email: string;
  password: string;
}

interface GoogleSigninRequest {
  redirect?: string;
}

interface AuthResponse {
  success: boolean;
  data?: any;
  message?: string;
}

// -----------------------------
// Signup Hook
// -----------------------------
export const useSignup = () => {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, Error, SignupRequest>({
    mutationFn: async ({ email, password, role }) => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw mapAuthError(error);

      return { success: true, data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
};

// -----------------------------
// Signin Hook
// -----------------------------
export const useSignin = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<AuthResponse, Error, SigninRequest>({
    mutationFn: async ({ email, password }) => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw mapAuthError(error);

      // Determine user role for redirect
      const role = data.user?.user_metadata?.role || "buyer";

      return { success: true, data: { user: data.user, role } };
    },
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });

      const role = data?.user?.user_metadata?.role || "buyer";
      router.replace(role === "seller" ? "/sellers/dashboard" : "/buyer/profile");
    },
  });
};

// -----------------------------
// Google Signin Hook
// -----------------------------
export const useGoogleSignin = () => {
  const router = useRouter();

  return useMutation<AuthResponse, Error, GoogleSigninRequest>({
    mutationFn: async ({ redirect }) => {
      const supabase = createClient();
      // OAuth callback MUST point to the server API route
      // Google's OAuth server will POST to this endpoint with the auth code
      const apiCallbackUrl = `${window.location.origin}/api/auth/callback`;
      const redirectUrl = redirect ? `${apiCallbackUrl}?redirect=${encodeURIComponent(redirect)}` : apiCallbackUrl;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl },
      });

      if (error) throw mapAuthError(error);

      // redirect user to OAuth URL
      if (data.url) {
        window.location.href = data.url;
      }

      return { success: true };
    },
  });
};

// -----------------------------
// Resend Verification Hook
// -----------------------------
export const useResendVerification = () => {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, Error, string>({
    mutationFn: async (email) => {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });

      if (error) throw mapAuthError(error);

      return { success: true, message: "Verification email sent." };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
};
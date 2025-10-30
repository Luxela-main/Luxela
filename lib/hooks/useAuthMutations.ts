import { useMutation, useQueryClient } from '@tanstack/react-query';

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_BASE_URL || "https://luxela-3s8u.onrender.com";

interface SignupRequest {
  email: string;
  password: string;
  role: string;
}

interface SigninRequest {
  email: string;
  password: string;
}

interface SignupResponse {
  success: boolean;
  data?: any;
  message?: string;
}

interface SigninResponse {
  success: boolean;
  data?: any;
  needsRole?: boolean;
}

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

export const useSignup = () => {
  const queryClient = useQueryClient();

  return useMutation<SignupResponse, Error, SignupRequest>({
    mutationFn: async (credentials: SignupRequest) => {
      const res = await fetch(`${AUTH_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        throw mapAuthError({ message: data?.message || "Sign up failed" });
      }

      return {
        success: true,
        data,
        message: data?.message || "Please check your email to confirm your account.",
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
};

export const useSignin = () => {
  const queryClient = useQueryClient();

  return useMutation<SigninResponse, Error, SigninRequest>({
    mutationFn: async (credentials: SigninRequest) => {
      const res = await fetch(`${AUTH_BASE_URL}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        throw mapAuthError({ message: data?.message || "Invalid email or password" });
      }

      return {
        success: true,
        data,
        needsRole: false,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
};

export const useResendVerification = () => {
  return useMutation<{ success: boolean; message?: string }, Error, string>({
    mutationFn: async (email: string) => {
      const res = await fetch(`${AUTH_BASE_URL}/api/auth/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        throw mapAuthError({ message: data?.message || "Failed to resend email" });
      }

      return {
        success: true,
        message: data?.message || "Verification email resent successfully.",
      };
    },
  });
};


"use client";

import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/hooks/useToast";

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Get the user's ID token
      const token = await result.user.getIdToken();

      // Store the token in localStorage
      localStorage.setItem("authToken", token);

      // Show success message
      toast.success("Google login successful");

      // Redirect to home page
      router.push("/");

      return { uid: result.user.uid, token };
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      setError(error.message);
      toast.error(error.message || "Google login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { signInWithGoogle, loading, error };
}

"use client";

import { useState } from "react";
// import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
// import { auth } from "@/lib/firebase";
import { useToast } from "@/components/hooks/useToast";
import { createClient } from "@/lib/supabase/client";

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const signInWithGoogle = async () => {
    const supabase = createClient();

    setLoading(true);
    setError(null);

    // try {
  //     const provider = new GoogleAuthProvider();
  //     const result = await signInWithPopup(auth, provider);

  //     // Get the user's ID token
  //     const token = await result.user.getIdToken();

  //     // Store the token in localStorage
  //     localStorage.setItem("authToken", token);

  //     // Show success message
  //     toast.success("Google login successful");

  //     // Redirect to home page
  //     router.push("/");

  //     return { uid: result.user.uid, token };
  //   } catch (error: any) {
  //     console.error("Google sign-in error:", error);
  //     setError(error.message);
  //     toast.error(error.message || "Google login failed");
  //     throw error;
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // return { signInWithGoogle, loading, error };
   try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback/`, 
        },
      });

      if (error) throw error;

      // Explicitly redirect using returned URL (reliable across environments)
      if (data?.url) {
        toast.success("Redirecting to Google...");
        window.location.href = data.url;
        return;
      }

      throw new Error("Failed to initiate Google sign-in");
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      setError(err.message);
      toast.error(err.message || "Google login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { signInWithGoogle, loading, error };
}

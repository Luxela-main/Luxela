// "use client";

// import { useState } from "react";
// import { GoogleAuthProvider, signInWithPopup, getIdToken } from "firebase/auth";
// import { auth } from "@/lib/firebase";

// type AuthError = string | null;

// class GoogleAuthService {
//   private baseUrl = "https://auth-backend-kx7l.onrender.com/api/auth";
//   private userBaseUrl = "https://auth-backend-kx7l.onrender.com/api/user";

//   // Sign in with Google using Firebase
//   async signInWithGoogle(): Promise<{
//     uid: string;
//     token: string;
//     email: string;
//   }> {
//     try {
//       const provider = new GoogleAuthProvider();
//       const result = await signInWithPopup(auth, provider);
//       const token = await getIdToken(result.user);
//       const uid = result.user.uid;
//       const email = result.user.email || "";

//       return { uid, token, email };
//     } catch (error: any) {
//       throw new Error(error.message || "Google sign-in failed");
//     }
//   }

//   // Verify token with backend
//   async verifyToken(firebaseIdToken: string): Promise<string> {
//     const url = `${this.baseUrl}/verify-token`;
//     const response = await fetch(url, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${firebaseIdToken}`,
//       },
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || "Token verification failed");
//     }

//     const data = await response.json();
//     return data.uid;
//   }

//   // Add user data to backend DB
//   async addUserData(data: any, token: string): Promise<{ id: string }> {
//     const response = await fetch(`${this.userBaseUrl}/add`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(data),
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || "Add user data failed");
//     }

//     return await response.json();
//   }
// }

// const googleAuthService = new GoogleAuthService();

// export function useGoogleAuth() {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<AuthError>(null);

//   async function signInWithGoogle() {
//     setLoading(true);
//     setError(null);

//     try {
//       // 1. Firebase Google Sign-in
//       const { uid, token, email } = await googleAuthService.signInWithGoogle();

//       // 2. Verify token with backend
//       await googleAuthService.verifyToken(token);

//       // 3. Save user data to backend (optional: only if new user)
//       await googleAuthService.addUserData({ uid, email }, token);

//       // 4. Store token locally
//       localStorage.setItem("authToken", token);

//       return { uid, token, email };
//     } catch (err: any) {
//       setError(err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }

//   return { signInWithGoogle, loading, error };
// }

// // onClick={async () => {
// //   try {
// //     const { email } = await signInWithGoogle();
// //     toast.success(`Welcome ${email}`);
// //     router.push("/privacy-policy"); // or /verify-email for sign-up
// //   } catch (error: any) {
// //     toast.error(error.message || "Google sign-in failed");
// //   }
// // }}

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

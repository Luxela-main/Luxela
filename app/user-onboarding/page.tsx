"use client";

import React, { useState } from "react";
import { useAddUserData, useSignIn, useSignUp } from "../auth/index"; 
import { useToast } from "@/components/hooks/useToast";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const { signUp, loading: signupLoading, error: signupError } = useSignUp();
  const { signIn } = useSignIn();
  const { addUserData } = useAddUserData();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const router = useRouter();
  const toast = useToast();

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!agreeTerms) return toast.warning("Agree to the terms");

    try {
      // 1. Create user in Firebase
      await signUp(email, password);
      
      // 2. Sign in to get the ID token
      const { uid, token } = await signIn(email, password);
      
      // 3. Store user data in the backend
      await addUserData({ uid, email }, token);

      toast.success("Account created successfully!");
      router.push("/email-verification");

    } catch (error: any) {
      toast.error(error.message || "Signup failed");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-zinc-900 text-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-2">Welcome to Luxela</h2>
        <p className="text-sm text-center text-zinc-400 mb-6">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>

        <button
          className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-sm py-2 rounded mb-4"
          onClick={() => alert("Google sign-in not implemented")}
          type="button"
        >
          <span>Sign up with Google</span>
          <img src="/google.svg" alt="Google" className="h-4 w-4" />
        </button>

        <div className="text-center text-zinc-500 my-4 text-sm">Or</div>

        <form className="space-y-4" onSubmit={handleSignUp}>
    
          <input
            type="email"
            placeholder="Enter your email address"
            className="w-full px-3 py-2 bg-zinc-800 rounded text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="At least 8 characters"
            className="w-full px-3 py-2 bg-zinc-800 rounded text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength={8}
            required
          /> 
          <div className="flex items-start text-sm">
            <input
              type="checkbox"
              className="mr-2 mt-1 accent-purple-600"
              checked={agreeTerms}
              onChange={e => setAgreeTerms(e.target.checked)}
            />
            <label>
              I agree to Luxela’s{" "}
              <a href="./components/privacy-policy.tsx" className="text-purple-400 underline">
                terms and conditions
              </a>
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded text-sm disabled:opacity-50"
            disabled={signupLoading}
          >
            {signupLoading ? "Creating account..." : "Create my account"}
          </button>
        </form>
        <p className="text-center text-zinc-500 text-sm mt-4">
          Already have an account?{" "}
          <a href="../signin" className="text-purple-400 underline">
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
}

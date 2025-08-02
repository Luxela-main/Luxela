"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSignIn } from "../auth/index";
import { useToast } from "@/components/hooks/useToast";

export default function SignInPage() {
  const router = useRouter();
  const toast = useToast();
  const { signIn, loading } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!agreed) {
      toast.warning("You must agree to the terms and conditions.");
      return;
    }

    try {
      await signIn(email, password);
      router.push("/privacy-policy");
    } catch (error: any) {
      toast.error(error.message || "Sign in failed");
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

        <form className="space-y-4" onSubmit={handleSignIn}>
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 rounded text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
          <input
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 rounded text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
          <div className="flex items-start text-sm">
            <input
              type="checkbox"
              className="mr-2 mt-1 accent-purple-600"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <label>
              I agree to Luxela’s <a href="#" className="text-purple-400 underline">terms and conditions</a>
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded text-sm"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-zinc-500 text-sm mt-4">
          Don’t have an account? <a href="../user-onboarding" className="text-purple-400 underline">Sign Up here</a>
        </p>
      </div>
    </div>
  );
}
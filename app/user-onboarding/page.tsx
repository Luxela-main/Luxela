'use client'

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {

          const router = useRouter();


    const handleSignUp = (event: React.FormEvent) => {
        event.preventDefault();
        
         router.push('/user-onboarding/email-verification');
          // Our Handle sign-up logic goes here
    };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-zinc-900 text-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-2">Welcome to Luxela</h2>
        <p className="text-sm text-center text-zinc-400 mb-6">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>

        <button className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-sm py-2 rounded">
          <span>Sign up with Google</span>
          <img src="/google.svg" alt="Google" className="h-4 w-4" />
        </button>

        <div className="text-center text-zinc-500 my-4 text-sm">Or</div>

        <form className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email address"
            className="w-full px-3 py-2 bg-zinc-800 rounded text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="password"
            placeholder="At least 8 characters"
            className="w-full px-3 py-2 bg-zinc-800 rounded text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="flex items-start text-sm">
            <input type="checkbox" className="mr-2 mt-1 accent-purple-600" />
            <label>
              I agree to Luxela’s <a href="./components/privacy-policy.tsx" className="text-purple-400 underline">terms and conditions</a>
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded text-sm"
            onClick={handleSignUp}
          >
            Create my account
          </button>
        </form>

        <p className="text-center text-zinc-500 text-sm mt-4">
          Already have an account? <Link href="../signin" className="text-purple-400 underline">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}

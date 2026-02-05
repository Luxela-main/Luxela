"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-gradient-to-b from-[#0E0E0E] to-[#1a1a1a]">
      <CheckCircle2 className="w-16 h-16 text-[#9CA3AF] mb-6" />
      <h1 className="text-2xl font-semibold mb-2 text-white border-b-2 border-[#D1D5DB] pb-3 inline-block">Email Verified</h1>
      <p className="text-[#6B7280] mb-8 mt-4">
        Your email has been successfully verified. You can now sign in to your account.
      </p>

      <Link
        href="/signin"
        className="px-5 py-2.5 rounded-md bg-gradient-to-b from-purple-600 to-purple-400 via-purple-500 hover:from-purple-700 hover:to-purple-500 transition-colors"
      >
        Go to Sign In
      </Link>
    </div>
  );
}
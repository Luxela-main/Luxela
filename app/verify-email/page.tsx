"use client";

import { useRef, useEffect } from "react";
import { useVerifyEmail } from "../auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/hooks/useToast";
import { Header } from "../signup/components/header";

export default function VerifyEmailPage() {
  const { verifyEmail, loading, error } = useVerifyEmail();
  const searchParams = useSearchParams();

  const toast = useToast();
  const router = useRouter();

  const oobCode = searchParams.get("oobCode");

  useEffect(() => {
    if (oobCode) {
      handleVerification(oobCode);
    }
  }, [oobCode]);

  const inputs = Array.from({ length: 6 }, () =>
    useRef<HTMLInputElement>(null)
  );

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    if (value.length === 1 && index < inputs.length - 1) {
      inputs[index + 1].current?.focus();
    } else if (value.length === 0 && index > 0) {
      inputs[index - 1].current?.focus();
    }
  };

  const handleVerification = async (code: string) => {
    try {
      await verifyEmail(code);
      toast.success("Email verified successfully!");
      router.push("/privacy-policy");
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen flex justify-center pt-20 bg-[#1a1a1a] overflow-y-hidden">
        <div className="text-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-normal mb-2">Verify your Account</h2>
          <div className="my-6 flex justify-center items-center gap-4">
            <div className="h-2 w-60 rounded-2xl bg-purple-600"></div>
            <div className="h-2 w-60 rounded-2xl bg-purple-600"></div>
          </div>
          <h3>Email Verification</h3>
          <p className="text-sm text-zinc-400 mb-6">
            Enter the code sent to your email to verify your account
          </p>

          <div className="flex justify-center gap-4 my-12">
            {inputs.map((ref, index) => (
              <input
                placeholder="-"
                key={index}
                ref={ref}
                maxLength={1}
                className="w-12 h-10 text-center text-lg bg-zinc-800 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                onChange={(e) => handleInput(e, index)}
              />
            ))}
          </div>

          <button
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded text-sm cursor-pointer"
            onClick={() => {
              const code = inputs
                .map((ref) => ref.current?.value || "")
                .join("");
              handleVerification(code);
            }}>
            Verify
          </button>

          <p className="text-sm text-zinc-500 mt-4">
            Didn't get a code?{" "}
            <a href="#" className="text-purple-400 underline">
              Resend Code
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

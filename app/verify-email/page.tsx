"use client";

import { useRef, useState, useEffect } from "react";
import { verifyOtpSchema } from '@/lib/utils/validation';
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/hooks/useToast";
import { Header } from "../signup/components/header";
import { verifyOtp } from '@/lib/utils/auth-helpers';


export default function VerifyEmailPage() {
  const toast = useToast();
  const router = useRouter();

  const inputs = Array.from({ length: 6 }, () =>
    useRef<HTMLInputElement>(null)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isPasswordReset, setIsPasswordReset] = useState(false);


  useEffect(() => {
    const storedEmail = sessionStorage.getItem('verificationEmail');
    if (!storedEmail) {
      router.push('/signup');
      return;
    }

    const passwordResetFlag = sessionStorage.getItem('isPasswordReset');
    setIsPasswordReset(passwordResetFlag === 'true');

    setEmail(storedEmail);
  }, [router]);


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
      console.log("Verifying code:", code); // 👈 check if button fires

    if (!email) {
      toast.error("Missing email context");
      return;
    }

    const parsed = verifyOtpSchema.safeParse({ code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid code");
      return;
    }
  

    setIsLoading(true);
    setError(null);

    try {
       const result = await verifyOtp(email, code);
      sessionStorage.removeItem('verificationEmail');

      if (isPasswordReset) {
        router.push('/new-password');
      } else {
        sessionStorage.removeItem('isPasswordReset');

        await fetch('/api/resend', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'welcome',
            email: email,
            origin: window.location.origin,
          }),
        });

        router.push('/');
      }
    }  catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred during verification'
      );
    } finally {
      setIsLoading(false);
    }
  }

  const resendOtp = async () => {
    if (!email) {
      toast.error("Missing email context");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Resend verification email
      await fetch('/api/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'verification',
          email,
          isPasswordReset: isPasswordReset,
        }),
      });

      setError('A new verification code has been sent to your email.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to resend verification code'
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (!email) {
    return null;
  }

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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const code = inputs.map((ref) => ref.current?.value || "").join("");
                  handleVerification(code);
                }
              }}
            />
          ))}
        </div>

        <button
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded text-sm cursor-pointer"
          onClick={() => {
            const code = inputs
              .map((ref) => ref.current?.value || "")
              .join("");
            handleVerification(code);
          }}
        >
           {isLoading ? "Verifying..." : "Verify"}
        </button>

        
{/* Show error message */}
{error && (
  <p className="text-red-500 text-sm mt-2">{error}</p>
)}


          <p className="text-sm text-zinc-500 mt-4">
            Didn't get a code?{" "}
            <button
              className="text-purple-400 underline hover:text-purple-300 disabled:opacity-50"
              disabled={isLoading}
              onClick={(e) => {
                e.preventDefault();
                resendOtp();
              }}
            >
              Resend Code
            </button>
          
          </p>
        </div>
      </div>
    </>
  );
}

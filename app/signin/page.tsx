"use client";

import React, { useState, Suspense } from "react";
import { useToast } from "@/components/hooks/useToast";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signinSchema, signInInitialValues } from "@/lib/utils/validation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignin, useResendVerification } from "@/lib/hooks";
import { EmailVerificationDialog } from "@/components/email-verification-dialog";
import GoogleSignInButton from "@/components/auth/google";

function SignInContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();

  const signinMutation = useSignin();
  const resendMutation = useResendVerification();

  const handleSignIn = async (values: { email: string; password: string }, { setSubmitting }: any) => {
    try {
      const result = await signinMutation.mutateAsync(values);

      if (result.success) {
        toast.success("Welcome back!");
        router.push("/dashboard");
      }
    } catch (err: any) {
      if (err.message.includes("not verified")) {
        setUnverifiedEmail(values.email);
        setDialogOpen(true);
      } else {
        toast.error(err.message || "Invalid email or password");
      }
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <>
      <div className="grid md:grid-cols-2 min-h-screen bg-[#1a1a1a] text-white">
        {/* Left Side */}
        <div className="relative md:flex items-center justify-center p-10 hidden">
          <div className="absolute inset-0 bg-[url('/images/auth.png')] bg-cover bg-center rounded-tr-3xl rounded-br-3xl"></div>
          <div className="relative z-10 max-w-md p-10 rounded-2xl border border-purple-500 backdrop-blur-md bg-black/30">
            <img src="/luxela.svg" alt="Luxela Logo" className="w-40 mb-8" />
            <h2 className="text-3xl font-semibold mb-4">
              Embrace The Future of{" "}
              <span className="text-purple-500">Fashion</span>
            </h2>
            <p className="text-zinc-300 text-sm leading-relaxed">
              We're reimagining what it means to shop and sell fashion globally.
              Exploring, supporting, and connecting with the global community of
              creators on Luxela.
            </p>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-sm">
            <img src="/luxela.svg" alt="Luxela Logo" className="w-32 mb-6" />
            <h2 className="text-2xl font-semibold">Welcome back</h2>
            <p className="text-sm text-zinc-400 mb-6">
              Enter your email and password to access your account
            </p>

            <Formik
              initialValues={signInInitialValues}
              validationSchema={signinSchema}
              onSubmit={handleSignIn}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="space-y-4">
                  {/* Email */}
                  <div>
                    <Label htmlFor="email" className="mb-1">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                      <Field
                        as={Input}
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        className={`pl-10 ${errors.email && touched.email
                          ? "border-destructive"
                          : ""
                          }`}
                      />
                    </div>
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="text-sm text-destructive mt-1"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <Label htmlFor="password" className="mb-1">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                      <Field
                        as={Input}
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className={`pl-10 pr-10 ${errors.password && touched.password
                          ? "border-destructive"
                          : ""
                          }`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="text-sm text-destructive mt-1"
                    />
                  </div>

                  {/* Remember me & Forgot Password */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="rememberMe"
                        className="mr-2 accent-purple-600"
                      />
                      <Label htmlFor="rememberMe">Remember me</Label>
                    </div>
                    <Link
                      href="/forgot-password"
                      className="text-purple-400 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-b from-purple-600 to-purple-400 via-purple-500 hover:from-purple-700 hover:to-purple-500"
                    disabled={isSubmitting || signinMutation.isPending}
                  >
                    {isSubmitting || signinMutation.isPending ? "Signing In..." : "Sign In"}
                  </Button>
                </Form>
              )}
            </Formik>

            {/* Or divider */}
            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-zinc-700"></div>
              <span className="px-2 text-zinc-500 text-sm">Or</span>
              <div className="flex-grow border-t border-zinc-700"></div>
            </div>

            {/* Google Sign-in */}
            <GoogleSignInButton />

            {/* Not a registered user */}
            <p className="text-center text-zinc-500 text-sm mt-4">
              Not a registered user?{" "}
              <Link href="/signup" className="text-purple-400 underline">
                Sign Up <ArrowRight className="h-4 w-4 inline-block" />
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* 🔹 Email Verification Dialog */}
      <EmailVerificationDialog
        dialogOpen={dialogOpen}
        userEmail={unverifiedEmail}
        handleResendVerification={async () => {
          setIsResending(true);
          try {
            await resendMutation.mutateAsync(unverifiedEmail);
            toast.success("Verification email resent! Please check your inbox.");
            setDialogOpen(false);
          } catch (error: any) {
            toast.error(error.message || "Failed to resend email");
          } finally {
            setIsResending(false);
          }
        }}
        setDialogOpen={() => setDialogOpen(false)}
        isResending={isResending}
      />

    </>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
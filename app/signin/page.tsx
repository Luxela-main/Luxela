"use client";

import React, { useState, Suspense } from "react";
import { useToast } from "@/components/hooks/useToast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { signinSchema, signInInitialValues } from "@/lib/utils/validation";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmailVerificationDialog } from "@/components/email-verification-dialog";
import GoogleSignInButton from "@/components/auth/google";
import * as authActions from "@/app/actions/auth";
import { useAuth } from "@/context/AuthContext";

type SignInFormValues = {
  email: string;
  password: string;
};

function SignInContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isResending, setIsResending] = useState(false);



 const { setUser } = useAuth(); // Get setUser from context
  const router = useRouter();
  const toast = useToast();

  const handleSignIn = async (
    values: SignInFormValues,
    { setSubmitting, resetForm }: any
  ) => {
    try {
      const { email, password } = values;

      const { success, error, user } = await authActions.signinAction(email, password);

      if (success && user) {
        // Set user in context BEFORE redirecting
        setUser(user);
        
        toast.success("Welcome back!");
        resetForm();
        
        const role = user.user_metadata?.role === "seller" ? "seller" : "buyer";
        
        // Tiny delay to ensure state updates
        await new Promise(resolve => setTimeout(resolve, 50));
        
        router.push(role === "seller" ? "/sellers/dashboard" : "/buyer/profile");
        return;
      }

      // Handle unverified email
      if (error?.toLowerCase().includes("not verified")) {
        setUnverifiedEmail(email);
        setDialogOpen(true);
      } else {
        toast.error(error || "Invalid email or password");
      }
    
  } catch (err: unknown) {
    if (err instanceof Error) {
      toast.error(err.message || "Sign-in failed unexpectedly");
    } else {
      toast.error("Sign-in failed unexpectedly");
    }
  } finally {
    setSubmitting(false);
  }
};

const handleResendVerification = async () => {
  if (!unverifiedEmail) return;

  setIsResending(true);
  try {
    const { success, error } = await authActions.resendVerificationAction(unverifiedEmail);

    if (success) {
      toast.success("Verification email resent! Check your inbox.");
      setDialogOpen(false);
    } else {
      toast.error(error || "Failed to resend verification email");
    }
  } catch (err: unknown) {
    if (err instanceof Error) toast.error(err.message || "Failed to resend verification email");
    else toast.error("Failed to resend verification email");
  } finally {
    setIsResending(false);
  }
};

  return (
    <>
      <div className="grid md:grid-cols-2 min-h-screen bg-[#1a1a1a] text-white">
        {/* Left Side */}
        <div className="relative md:flex items-center justify-center p-10 hidden">
          <div className="absolute inset-0 bg-[url('/images/auth.webp')] bg-cover bg-center rounded-tr-3xl rounded-br-3xl" />
          <div className="relative z-10 max-w-md p-10 rounded-2xl border border-purple-500 backdrop-blur-md bg-black/30">
            <img src="/luxela.svg" alt="Luxela Logo" className="w-40 mb-8" />
            <h2 className="text-3xl font-semibold mb-4">
              Embrace The Future of <span className="text-purple-500">Fashion</span>
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
                        className={`pl-10 ${errors.email && touched.email ? "border-destructive" : ""}`}
                      />
                    </div>
                    <ErrorMessage name="email" component="div" className="text-sm text-destructive mt-1" />
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
                        className={`pl-10 pr-10 ${errors.password && touched.password ? "border-destructive" : ""}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <ErrorMessage name="password" component="div" className="text-sm text-destructive mt-1" />
                  </div>

                  {/* Remember & Forgot */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <input type="checkbox" id="rememberMe" className="mr-2 accent-purple-600" />
                      <Label htmlFor="rememberMe">Remember me</Label>
                    </div>
                    <Link href="/forgot-password" className="text-purple-400 hover:underline">Forgot password?</Link>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-b from-purple-600 to-purple-400 via-purple-500 hover:from-purple-700 hover:to-purple-500"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Signing In..." : "Sign In"}
                  </Button>
                </Form>
              )}
            </Formik>

            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-zinc-700" />
              <span className="px-2 text-zinc-500 text-sm">Or</span>
              <div className="flex-grow border-t border-zinc-700" />
            </div>

            <GoogleSignInButton />

            {/* Not registered */}
            <p className="text-center text-zinc-500 text-sm mt-4">
              Not a registered user?{" "}
              <Link href="/signup" className="text-purple-400 underline">
                Sign Up <ArrowRight className="h-4 w-4 inline-block" />
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Email Verification Dialog */}
      <EmailVerificationDialog
        dialogOpen={dialogOpen}
        userEmail={unverifiedEmail}
        setDialogOpen={() => setDialogOpen(false)}
        handleResendVerification={handleResendVerification}
        isResending={isResending}
      />
    </>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]"><div className="text-white">Loading...</div></div>}>
      <SignInContent />
    </Suspense>
  );
}
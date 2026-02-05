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

  const { setUser } = useAuth();
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
        setUser(user);
        
        toast.success("Welcome back!");
        resetForm();
        
        const role = user.user_metadata?.role === "seller" ? "seller" : "buyer";
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        router.push(role === "seller" ? "/sellers/dashboard" : "/buyer/profile");
        return;
      }

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
        {/* Left Side - Enhanced with Gradients */}
        <div className="relative md:flex items-center justify-center p-10 hidden overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/auth.webp')] bg-cover bg-center rounded-tr-3xl rounded-br-3xl" />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 rounded-tr-3xl rounded-br-3xl bg-gradient-to-br from-[#E5E7EB]/25 via-[#8451E1]/10 to-[#E5E7EB]/25" />
          {/* Corner Decorations */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#6B7280]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#9CA3AF]/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 max-w-md p-10 rounded-2xl border-2 border-[#D1D5DB]/40 backdrop-blur-md bg-black/50 hover:border-[#E5E7EB]/60 transition-colors duration-300">
            <img src="/luxela.svg" alt="Luxela Logo" className="w-40 mb-8" />
            <h2 className="text-3xl font-semibold mb-4">
              Embrace The Future of <span className="text-[#6B7280]">Fashion</span>
            </h2>
            <p className="text-zinc-300 text-sm leading-relaxed">
              We're reimagining what it means to shop and sell fashion globally.
              Exploring, supporting, and connecting with the global community of
              creators on Luxela.
            </p>
            {/* Accent Line */}
            <div className="mt-6 h-1 w-12 bg-gradient-to-r from-[#E5E7EB] via-[#8451E1] to-[#E5E7EB] rounded-full" />
          </div>
        </div>

        {/* Right Side - Form with Enhanced Colors */}
        <div className="flex items-center justify-center p-8 relative">
          {/* Background Accent */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#D1D5DB]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#E5E7EB]/5 rounded-full blur-3xl" />
          
          <div className="w-full max-w-sm relative z-10">
            <img src="/luxela.svg" alt="Luxela Logo" className="w-32 mb-6" />
            
            <div className="mb-6 pb-6 border-b-2 border-[#D1D5DB]/20">
              <h2 className="text-2xl font-semibold relative pb-2">
                Welcome back
                <span className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-[#6B7280] to-[#E5E7EB]"></span>
              </h2>
              <p className="text-sm text-zinc-400 mt-3">
                Enter your email and password to access your account
              </p>
            </div>

            <Formik
              initialValues={signInInitialValues}
              validationSchema={signinSchema}
              onSubmit={handleSignIn}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="space-y-4">
                  {/* Email - Cyan Border */}
                  <div className="group">
                    <Label htmlFor="email" className="mb-2 block text-[#E5E7EB] font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-[#E5E7EB]/60 group-focus-within:text-[#E5E7EB]" />
                      <Field
                        as={Input}
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        className={`pl-10 border-2 transition-all ${errors.email && touched.email ? "border-destructive bg-destructive/5" : "border-[#E5E7EB]/30 focus:border-[#E5E7EB]/60 focus:bg-[#E5E7EB]/5"}`}
                      />
                    </div>
                    <ErrorMessage name="email" component="div" className="text-sm text-destructive mt-1" />
                  </div>

                  {/* Password - Pink Border */}
                  <div className="group">
                    <Label htmlFor="password" className="mb-2 block text-[#E5E7EB] font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-[#E5E7EB]/60 group-focus-within:text-[#E5E7EB]" />
                      <Field
                        as={Input}
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className={`pl-10 pr-10 border-2 transition-all ${errors.password && touched.password ? "border-destructive bg-destructive/5" : "border-[#E5E7EB]/30 focus:border-[#E5E7EB]/60 focus:bg-[#E5E7EB]/5"}`}
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

                  {/* Remember & Forgot - Mint Border */}
                  <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-[#9CA3AF]/5 border-2 border-[#9CA3AF]/30 hover:border-[#9CA3AF]/50 hover:bg-[#9CA3AF]/10 transition-all duration-300">
                    <div className="flex items-center">
                      <input type="checkbox" id="rememberMe" className="mr-2 accent-[#8451E1] cursor-pointer" />
                      <Label htmlFor="rememberMe" className="cursor-pointer">Remember me</Label>
                    </div>
                    <Link href="/forgot-password" className="text-[#D1D5DB] hover:text-[#6B7280] font-medium transition-colors underline">
                      Forgot password?
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-b from-[#8451E1] to-[#7240D0] hover:from-[#9468F2] hover:to-[#8451E1] text-white font-semibold py-6 mt-6 transition-all duration-300 hover:shadow-lg hover:shadow-[#8451E1]/50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Signing In..." : "Sign In"}
                  </Button>
                </Form>
              )}
            </Formik>

            {/* Divider with Accent Colors */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-gradient-to-r from-[#6B7280]/30 via-transparent to-transparent" />
              <span className="px-3 text-[#D1D5DB] text-sm font-medium">Or</span>
              <div className="flex-1 h-px bg-gradient-to-l from-[#E5E7EB]/30 via-transparent to-transparent" />
            </div>

            <GoogleSignInButton />

            {/* Not registered - Coral Border */}
            <div className="mt-6 p-4 rounded-lg border-2 border-[#6B7280]/30 bg-[#6B7280]/5 hover:border-[#6B7280]/50 hover:bg-[#6B7280]/10 transition-all duration-300">
              <p className="text-center text-zinc-400 text-sm">
                Not a registered user?{" "}
                <Link href="/signup" className="text-[#6B7280] hover:text-[#E5E7EB] font-bold underline transition-colors">
                  Sign Up <ArrowRight className="h-4 w-4 inline-block ml-1" />
                </Link>
              </p>
            </div>
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
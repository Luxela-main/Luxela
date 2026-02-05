"use client";

export const dynamic = 'force-dynamic';

import React, { useState, Suspense } from "react";
import { useToast } from "@/components/hooks/useToast";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import * as authActions from "@/app/actions/auth";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { signupSchema } from "@/lib/utils/validation";
import { Eye, EyeOff, Mail, Lock, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmailVerificationDialog } from "@/components/email-verification-dialog";
import GoogleSignInButton from "@/components/auth/google";

type SignUpFormValues = {
  email: string;
  password: string;
  confirmPassword: string;
  role: "buyer" | "seller" | "";
  agreeTerms: boolean;
};

function SignUpContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [isResending, setIsResending] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();

  // Check if email is already registered
  const checkEmailExists = async (email: string) => {
    try {
      const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Email check failed:", error);
      return { exists: null, error: "Failed to check email" };
    }
  };

  const handleSignUp = async (
  values: SignUpFormValues,
  { setSubmitting, resetForm }: any
) => {
  // Basic pre-submit validations
  if (!values.role) {
    toast.error("Please select a role before signing up.");
    setSubmitting(false);
    return;
  }

  if (!values.agreeTerms) {
    toast.error("You must agree to the Terms and Conditions.");
    setSubmitting(false);
    return;
  }

  if (values.password !== values.confirmPassword) {
    toast.error("Passwords do not match.");
    setSubmitting(false);
    return;
  }

  try {
    const { email, password, role } = values;

    // Check if email is already registered BEFORE attempting signup
    setIsCheckingEmail(true);
    const emailCheckResult = await checkEmailExists(email);
    setIsCheckingEmail(false);

    if (emailCheckResult.exists) {
      toast.error(
        emailCheckResult.message ||
          `This email is already registered as a ${emailCheckResult.role}. Please sign in instead.`
      );
      setSubmitting(false);
      return;
    }

    if (emailCheckResult.error) {
      toast.error("Failed to verify email. Please try again.");
      setSubmitting(false);
      return;
    }

    const { success, error } = await authActions.signupAction(
      email,
      password,
      role as "buyer" | "seller"
    );

    if (success) {
      setUserEmail(email);
      setDialogOpen(true);
      toast.success("Signup successful! Please verify your email.");
      resetForm();
      return;
    }

    // Handle common signup errors
    if (error?.toLowerCase().includes("already registered")) {
      toast.error("Email already registered. Please sign in instead.");
    } else if (error?.toLowerCase().includes("weak password")) {
      toast.error("Password too weak. Please choose a stronger password.");
    } else {
      toast.error(error || "Signup failed. Please try again.");
    }
  } catch (err: unknown) {
    if (err instanceof Error) toast.error(err.message || "Signup failed unexpectedly.");
    else toast.error("Signup failed unexpectedly.");
  } finally {
    setSubmitting(false);
  }
};

const handleResendVerification = async () => {
  if (!userEmail) return;

  setIsResending(true);
  try {
    const { success, error } = await authActions.resendVerificationAction(userEmail);

    if (success) {
      toast.success("Verification email resent! Check your inbox.");
      setDialogOpen(false);
    } else {
      toast.error(error || "Failed to resend verification email.");
    }
  } catch (err: unknown) {
    if (err instanceof Error) toast.error(err.message || "Failed to resend verification email.");
    else toast.error("Failed to resend verification email.");
  } finally {
    setIsResending(false);
  }
};

  return (
    <>
      <div className="grid md:grid-cols-2 min-h-screen bg-[#1a1a1a] text-white">
        {/* Left side - Enhanced */}
        <div className="relative md:flex items-center justify-center p-10 hidden overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/auth.webp')] bg-cover bg-center rounded-tr-3xl rounded-br-3xl" />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 rounded-tr-3xl rounded-br-3xl bg-gradient-to-br from-[#ECE3BE]/25 via-[#8451E1]/10 to-[#BEECE3]/25" />
          {/* Corner Decorations */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-[#BEE3EC]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#ECE3BE]/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 max-w-md p-10 rounded-2xl border-2 border-[#BEECE3]/40 backdrop-blur-md bg-black/50 hover:border-[#BEE3EC]/60 transition-colors duration-300">
            <img src="/luxela.svg" alt="Luxela Logo" className="w-40 mb-8" />
            <h2 className="text-3xl font-semibold mb-4">
              Embrace The Future of <span className="text-[#BEE3EC]">Fashion</span>
            </h2>
            <p className="text-zinc-300 text-sm leading-relaxed">
              We're reimagining what it means to shop and sell fashion globally.
              Exploring, supporting, and connecting with the global community of
              creators on Luxela.
            </p>
            {/* Accent Line */}
            <div className="mt-6 h-1 w-12 bg-gradient-to-r from-[#BEE3EC] via-[#8451E1] to-[#ECBEE3] rounded-full" />
          </div>
        </div>

        {/* Right side - Form */}
        <div className="flex items-center justify-center p-8 relative">
          {/* Background Accent */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-[#EA795B]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-[#ECE3BE]/5 rounded-full blur-3xl" />
          
          <div className="w-full max-w-sm relative z-10">
            <img src="/luxela.svg" alt="Luxela Logo" className="w-32 mb-6" />
            
            <div className="mb-6 pb-6 border-b-2 border-[#BEECE3]/20">
              <h2 className="text-2xl font-semibold relative pb-2">
                Create your account
                <span className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-[#BEE3EC] to-[#ECBEE3]"></span>
              </h2>
              <p className="text-sm text-zinc-400 mt-3">
                Join Luxela and start your fashion journey
              </p>
            </div>

            <Formik
              initialValues={{
                email: "",
                password: "",
                confirmPassword: "",
                role: "",
                agreeTerms: false,
              }}
              validationSchema={signupSchema}
              onSubmit={handleSignUp}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="space-y-4">
                  {/* Email */}
                  <div className="group">
                    <Label htmlFor="email" className="mb-2 block text-[#ECE3BE] font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-[#ECE3BE]/60 group-focus-within:text-[#ECE3BE]" />
                      <Field
                        as={Input}
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        className={`pl-10 border-2 transition-all ${errors.email && touched.email ? "border-destructive bg-destructive/5" : "border-[#ECE3BE]/30 focus:border-[#ECE3BE]/60 focus:bg-[#ECE3BE]/5"}`}
                      />
                    </div>
                    <ErrorMessage name="email" component="div" className="text-sm text-destructive mt-1" />
                  </div>

                  {/* Password */}
                  <div className="group">
                    <Label htmlFor="password" className="mb-2 block text-[#EA795B] font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-[#EA795B]/60 group-focus-within:text-[#EA795B]" />
                      <Field
                        as={Input}
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className={`pl-10 pr-10 border-2 transition-all ${errors.password && touched.password ? "border-destructive bg-destructive/5" : "border-[#EA795B]/30 focus:border-[#EA795B]/60 focus:bg-[#EA795B]/5"}`}
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

                  {/* Confirm Password */}
                  <div className="group">
                    <Label htmlFor="confirmPassword" className="mb-2 block text-[#ECBEE3] font-medium">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-[#ECBEE3]/60 group-focus-within:text-[#ECBEE3]" />
                      <Field
                        as={Input}
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className={`pl-10 pr-10 border-2 transition-all ${errors.confirmPassword && touched.confirmPassword ? "border-destructive bg-destructive/5" : "border-[#ECBEE3]/30 focus:border-[#ECBEE3]/60 focus:bg-[#ECBEE3]/5"}`}
                      />
                    </div>
                    <ErrorMessage name="confirmPassword" component="div" className="text-sm text-destructive mt-1" />
                  </div>

                  {/* Role */}
                  <div className="group">
                    <Label htmlFor="role" className="mb-2 block text-[#BEE3EC] font-medium">I am a</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-[#BEE3EC]/60" />
                      <Field
                        as="select"
                        name="role"
                        className={`w-full bg-black mt-1 rounded-md border-2 px-10 py-2 text-sm transition-all ${errors.role && touched.role ? "border-destructive" : "border-[#BEE3EC]/30 focus:border-[#BEE3EC]/60"}`}
                      >
                        <option value="" disabled>Select role</option>
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                      </Field>
                    </div>
                    <ErrorMessage name="role" component="div" className="text-sm text-destructive mt-1" />
                  </div>

                  {/* Terms */}
                  <div className="flex items-center text-sm p-3 rounded-lg bg-[#BEECE3]/5 border-2 border-[#BEECE3]/30 hover:border-[#BEECE3]/50 transition-all">
                    <Field
                      type="checkbox"
                      id="agreeTerms"
                      name="agreeTerms"
                      className="mr-2 accent-[#8451E1] cursor-pointer"
                    />
                    <Label htmlFor="agreeTerms" className="cursor-pointer">
                      I agree to all{" "}
                      <a href="/terms" className="text-[#EA795B] hover:text-[#ECBEE3] underline transition-colors">Terms and Conditions</a>
                    </Label>
                  </div>
                  <ErrorMessage name="agreeTerms" component="div" className="text-sm text-destructive" />

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-b from-[#8451E1] to-[#7240D0] hover:from-[#9468F2] hover:to-[#8451E1] text-white font-semibold py-6 mt-6 transition-all duration-300 hover:shadow-lg hover:shadow-[#8451E1]/50"
                    disabled={isSubmitting || isCheckingEmail}
                  >
                    {isCheckingEmail ? "Checking email..." : isSubmitting ? "Signing Up..." : "Sign up"}
                  </Button>
                </Form>
              )}
            </Formik>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-gradient-to-r from-[#ECE3BE]/30 via-transparent to-transparent" />
              <span className="px-3 text-[#BEE3EC] text-sm font-medium">Or</span>
              <div className="flex-1 h-px bg-gradient-to-l from-[#BEECE3]/30 via-transparent to-transparent" />
            </div>

            <GoogleSignInButton />

            {/* Already have account */}
            <div className="mt-6 p-4 rounded-lg border-2 border-[#BEE3EC]/30 bg-[#BEE3EC]/5 hover:border-[#BEE3EC]/50 hover:bg-[#BEE3EC]/10 transition-all duration-300">
              <p className="text-center text-zinc-400 text-sm">
                Already have an account?{" "}
                <Link href="/signin" className="text-[#BEE3EC] hover:text-[#ECE3BE] font-bold underline transition-colors">
                  Log in <ArrowRight className="h-4 w-4 inline-block ml-1" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Verification Dialog */}
      <EmailVerificationDialog
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        userEmail={userEmail}
        handleResendVerification={handleResendVerification}
        isResending={isResending}
      />
    </>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <SignUpContent />
    </Suspense>
  );
}
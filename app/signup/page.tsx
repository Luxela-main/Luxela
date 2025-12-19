"use client";

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

  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();

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
        {/* Left side */}
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

        {/* Right side */}
        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-sm">
            <img src="/luxela.svg" alt="Luxela Logo" className="w-32 mb-6" />
            <h2 className="text-2xl font-semibold">Create your account</h2>
            <p className="text-sm text-zinc-400 mb-6">
              Enter your email and password to create your account
            </p>

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

                  {/* Confirm Password */}
                  <div>
                    <Label htmlFor="confirmPassword" className="mb-1">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                      <Field
                        as={Input}
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className={`pl-10 pr-10 ${errors.confirmPassword && touched.confirmPassword ? "border-destructive" : ""}`}
                      />
                    </div>
                    <ErrorMessage name="confirmPassword" component="div" className="text-sm text-destructive mt-1" />
                  </div>

                  {/* Role */}
                  <div>
                    <Label htmlFor="role">I am a</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                      <Field
                        as="select"
                        name="role"
                        className={`w-full bg-black mt-1 rounded-md border border-input px-10 py-2 text-sm ${errors.role && touched.role ? "border-destructive" : ""}`}
                      >
                        <option value="" disabled>Select role</option>
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                      </Field>
                    </div>
                    <ErrorMessage name="role" component="div" className="text-sm text-destructive mt-1" />
                  </div>

                  {/* Terms */}
                  <div className="flex items-center text-sm">
                    <Field
                      type="checkbox"
                      id="agreeTerms"
                      name="agreeTerms"
                      className="mr-2 accent-purple-600"
                    />
                    <Label htmlFor="agreeTerms">
                      I agree to all{" "}
                      <a href="/terms" className="text-purple-400 underline">Terms and Conditions</a>
                    </Label>
                  </div>
                  <ErrorMessage name="agreeTerms" component="div" className="text-sm text-destructive" />

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-b from-purple-600 to-purple-400 via-purple-500 hover:from-purple-700 hover:to-purple-500"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Signing Up..." : "Sign up"}
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

            <p className="text-center text-zinc-500 text-sm mt-4">
              Already have an account?{" "}
              <Link href="/signin" className="text-purple-400 underline">
                Log in <ArrowRight className="h-4 w-4 inline-block" />
              </Link>
            </p>
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
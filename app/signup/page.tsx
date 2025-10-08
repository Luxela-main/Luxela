"use client";

import React, { useState } from "react";
import { useToast } from "@/components/hooks/useToast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signupSchema, signUpInitialValues } from "@/lib/utils/validation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DialogModal from "@/components/dialog";
import { signInWithGoogle } from "@/lib/auth";


export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
 // const redirect = searchParams.get("redirect");
  const priceId = searchParams.get("priceId");
  const discountCode = searchParams.get("discountCode");

  interface SignUpFormData {
    email: string;
    password: string;
    confirmPassword: string;
    agreeTerms: boolean;
  }
  

  const handleSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    setError(null);

    const { email, password, confirmPassword, agreeTerms } = data;

    if (!email) {
      setIsLoading(false);
      return toast.error("Email is required");
    }

    if (!password) {
      setIsLoading(false);
      return toast.error("Password is required");
    }

    if (!agreeTerms) {
      setIsLoading(false);
      return toast.warning("Please agree to the terms and conditions");
    }

    if (password !== confirmPassword) {
      setIsLoading(false);
      return toast.error("Passwords do not match");
    }

    try {
      sessionStorage.setItem('verificationEmail', data.email);

      await fetch('/api/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'verification',
          email: data.email,
          password: data.password,
        }),
      });
       toast.success("We sent a 6-digit code to your email");
      router.push(`/verify-email`);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "Signup failed";
    
      if (message.toLowerCase().includes("already registered") || message.toLowerCase().includes("already exists")) {
        toast.error(
          "This email is already registered. Please check your inbox (including spam) for a confirmation email, or try logging in or resetting your password."
        );
      } else {
        toast.error(message);
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="grid md:grid-cols-2 min-h-screen bg-[#1a1a1a]  text-white">
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
              Exploring, supporting and connecting with the global community of
              creators on Luxela.
            </p>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-sm">
            <img src="/luxela.svg" alt="Luxela Logo" className="w-32 mb-6" />
            <h2 className="text-2xl font-semibold">Create your account</h2>
            <p className="text-sm text-zinc-400 mb-6">
              Enter your email and password to create your account
            </p>

            <Formik
              initialValues={signUpInitialValues}
              validationSchema={signupSchema}
              onSubmit={handleSignUp}>
              {({ values, errors, touched, setFieldValue, isSubmitting }) => (
                <Form className="space-y-4">
                  {/* Email */}
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Field
                      as={Input}
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      className={`pl-10 ${
                        errors.email && touched.email
                          ? "border-destructive"
                          : ""
                      }`}
                    />
                  </div>
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-sm text-destructive"
                  />

                  {/* Password */}
                  <Label>Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Field
                      as={Input}
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className={`pl-10 pr-10 ${
                        errors.password && touched.password
                          ? "border-destructive"
                          : ""
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}>
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
                    className="text-sm text-destructive"
                  />

                  {/* Confirm Password */}
                  <Label>Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Field
                      as={Input}
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="pl-10 pr-10"
                    />
                  </div>
                  <ErrorMessage
                    name="confirmPassword"
                    component="div"
                    className="text-sm text-destructive"
                  />

                  {/* Agree to Terms */}
                  <div className="flex items-start text-sm">
                    <input
                      type="checkbox"
                      className="mr-2 mt-1 accent-purple-600"
                      checked={values.agreeTerms}
                      onChange={(e) =>
                        setFieldValue("agreeTerms", e.target.checked)
                      }
                    />
                    <label>
                      I agree to all{" "}
                      <a href="/terms" className="text-purple-400 underline">
                        Terms and Conditions
                      </a>
                    </label>
                  </div>
                  <ErrorMessage
                    name="agreeTerms"
                    component="div"
                    className="text-sm text-destructive"
                  />

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-700 hover:to-purple-500"
                    disabled={isSubmitting}>
                    {isSubmitting ? "Signing Up..." : "Sign up"}
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
            <button
              className="w-full flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 py-2 rounded text-sm"
              // onClick={signInWithGoogle}
              onClick={() => signInWithGoogle(priceId || "", discountCode || "", "/")}
              type="button">
              <img src="/google.svg" alt="Google" className="h-4 w-4" />
              Sign up with Google
            </button>

            {/* Already have account */}
            <p className="text-center text-zinc-500 text-sm mt-4">
              Already have an account?{" "}
              <Link href="/signin" className="text-purple-400 underline">
                Log in <ArrowRight className="h-4 w-4 inline-block" />
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* OPen modal if account already exist */}
      <DialogModal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Account already exists"
        description="Go to login and enter your account details to login"
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => router.push("/signin")}>Login</Button>
          </>
        }
      />
    </>
  );
}

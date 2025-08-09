"use client";

import React, { useState } from "react";
import { useSignIn } from "../auth/index";
import { useToast } from "@/components/hooks/useToast";
<<<<<<< HEAD
=======
import { useRouter } from "next/navigation";
import { useGoogleAuth } from "../auth/singinWithGoogle";
import Link from "next/link";
import { signInSchema, signInInitialValues } from "@/validation/schema";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
>>>>>>> 2b30e35 (Add validation schemas for auth forms)

export default function SignInPage() {
  const { signIn } = useSignIn();
  const { signInWithGoogle } = useGoogleAuth();
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const toast = useToast();
<<<<<<< HEAD
  const { signIn, loading } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!agreed) {
      toast.warning("You must agree to the terms and conditions.");
      return;
    }
=======

  const handleSignIn = async (values: any) => {
    const { email, password } = values;
>>>>>>> 2b30e35 (Add validation schemas for auth forms)

    try {
      await signIn(email, password);
      toast.success("Login Successful.");
      router.push("/privacy-policy");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    }
  };
  return (
<<<<<<< HEAD
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-zinc-900 text-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-2">Welcome to Luxela</h2>
        <p className="text-sm text-center text-zinc-400 mb-6">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>

        <button
          className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-sm py-2 rounded mb-4"
          onClick={() => alert("Google sign-in not implemented")}
          type="button"
        >
          <span>Sign up with Google</span>
          <img src="/google.svg" alt="Google" className="h-4 w-4" />
        </button>
=======
    <div className="grid md:grid-cols-2 min-h-screen bg-[#1a1a1a]  text-white">
      {/* Left Side */}
      <div className="relative flex items-center justify-center p-10">
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
          <h2 className="text-2xl font-semibold">Welcome back</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Enter your email and password to assess your account
          </p>
>>>>>>> 2b30e35 (Add validation schemas for auth forms)

          <Formik
            initialValues={signInInitialValues}
            validationSchema={signInSchema}
            onSubmit={handleSignIn}>
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
                      errors.email && touched.email ? "border-destructive" : ""
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

                {/*Remember me*/}
                <div className="flex items-start text-sm">
                  <input
                    type="checkbox"
                    className="mr-2 mt-1 accent-purple-600"
                  />
                  <label>Remember me</label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-700 hover:to-purple-500"
                  disabled={isSubmitting}>
                  {isSubmitting ? "Signing In..." : "Sign In"}
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
            onClick={signInWithGoogle}
            type="button">
            <img src="/google.svg" alt="Google" className="h-4 w-4" />
            Sign in with Google
          </button>

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
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/hooks/useToast";
import * as authActions from "@/app/actions/auth";

const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
});

const initialValues = {
  email: "",
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const handleForgotPassword = async (
    values: { email: string },
    { setSubmitting }: any
  ) => {
    try {
      const { success, error, message } = await authActions.forgotPasswordAction(
        values.email
      );

      if (success) {
        setSentEmail(values.email);
        setEmailSent(true);
        toast.success(message || "Password reset email sent!");
      } else {
        toast.error(error || "Failed to send password reset email");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || "An error occurred");
      } else {
        toast.error("An error occurred");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
          <Link
            href="/signin"
            className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-6 text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Link>

          <img src="/luxela.svg" alt="Luxela Logo" className="w-32 mb-6" />

          {!emailSent ? (
            <>
              <h2 className="text-2xl font-semibold">Forgot your password?</h2>
              <p className="text-sm text-zinc-400 mb-6">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>

              <Formik
                initialValues={initialValues}
                validationSchema={forgotPasswordSchema}
                onSubmit={handleForgotPassword}
              >
                {({ errors, touched, isSubmitting }) => (
                  <Form className="space-y-4">
                    <div>
                      <Label htmlFor="email" className="mb-1">
                        Email Address
                      </Label>
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
                        className="text-sm text-destructive mt-1"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-b from-purple-600 to-purple-400 via-purple-500 hover:from-purple-700 hover:to-purple-500"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </Form>
                )}
              </Formik>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold">Check your email</h2>
              <p className="text-sm text-zinc-400 mb-6">
                We've sent a password reset link to{" "}
                <span className="text-white font-semibold">{sentEmail}</span>.
                Click the link in the email to reset your password.
              </p>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-400">
                  ✓ Email sent successfully. Check your inbox and spam folder.
                </p>
              </div>

              <Button
                onClick={() => router.push("/signin")}
                className="w-full bg-gradient-to-b from-purple-600 to-purple-400 via-purple-500 hover:from-purple-700 hover:to-purple-500"
              >
                Back to Sign In
              </Button>

              <button
                onClick={() => setEmailSent(false)}
                className="w-full mt-3 text-purple-400 hover:text-purple-300 text-sm"
              >
                Didn't receive the email? Try again
              </button>
            </>
          )}

          <p className="text-center text-zinc-500 text-sm mt-8">
            Remember your password?{" "}
            <Link href="/signin" className="text-purple-400 underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
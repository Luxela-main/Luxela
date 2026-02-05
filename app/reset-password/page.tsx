"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/hooks/useToast";
import * as authActions from "@/app/actions/auth";

const resetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain uppercase, lowercase, number, and special character"
    )
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
});

const initialValues = {
  password: "",
  confirmPassword: "",
};

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [invalidToken, setInvalidToken] = useState(false);

  useEffect(() => {
    const resetToken = searchParams.get("token");
    const type = searchParams.get("type");

    if (!resetToken || type !== "recovery") {
      setInvalidToken(true);
      toast.error("Invalid or expired reset link");
    } else {
      setToken(resetToken);
    }
  }, [searchParams, toast]);

  const handleResetPassword = async (
    values: { password: string; confirmPassword: string },
    { setSubmitting }: any
  ) => {
    if (!token) {
      toast.error("Invalid reset token");
      return;
    }

    try {
      const { success, error, message } = await authActions.resetPasswordAction(
        values.password,
        token
      );

      if (success) {
        setResetSuccess(true);
        toast.success(message || "Password reset successfully!");
      } else {
        toast.error(error || "Failed to reset password");
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
          {invalidToken ? (
            <>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mb-4">
                  <svg
                    className="w-6 h-6 text-destructive"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold mb-2">Invalid Reset Link</h2>
                <p className="text-sm text-zinc-400 mb-6">
                  The reset link has expired or is invalid. Please request a new one.
                </p>

                <Link href="/forgot-password">
                  <Button className="w-full bg-gradient-to-b from-purple-600 to-purple-400 via-purple-500 hover:from-purple-700 hover:to-purple-500 mb-3">
                    Request New Reset Link
                  </Button>
                </Link>

                <Link href="/signin" className="text-purple-400 hover:text-purple-300 text-sm">
                  Back to Sign In
                </Link>
              </div>
            </>
          ) : resetSuccess ? (
            <>
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Password Reset Successfully</h2>
                <p className="text-sm text-zinc-400 mb-8">
                  Your password has been updated. You can now sign in with your new password.
                </p>

                <Link href="/signin">
                  <Button className="w-full bg-gradient-to-b from-purple-600 to-purple-400 via-purple-500 hover:from-purple-700 hover:to-purple-500">
                    Sign In Now
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-6 text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign In
              </Link>

              <img src="/luxela.svg" alt="Luxela Logo" className="w-32 mb-6" />

              <h2 className="text-2xl font-semibold border-b-2 border-[#ECBEE3] pb-3 inline-block">Reset your password</h2>
              <p className="text-sm text-[#EA795B] mb-6 mt-3">
                Enter a new password for your account. Make sure it's strong and secure.
              </p>

              <Formik
                initialValues={initialValues}
                validationSchema={resetPasswordSchema}
                onSubmit={handleResetPassword}
              >
                {({ errors, touched, isSubmitting, values }) => (
                  <Form className="space-y-4">
                    {/* Password */}
                    <div>
                      <Label htmlFor="password" className="mb-1">
                        New Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                        <Field
                          as={Input}
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          className={`pl-10 pr-10 ${
                            errors.password && touched.password ? "border-destructive" : ""
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <ErrorMessage
                        name="password"
                        component="div"
                        className="text-sm text-destructive mt-1"
                      />
                      {values.password && (
                        <div className="mt-2 text-xs text-zinc-400">
                          <p>Password must contain:</p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li
                              className={
                                values.password.length >= 8
                                  ? "text-green-400"
                                  : "text-zinc-500"
                              }
                            >
                              At least 8 characters
                            </li>
                            <li
                              className={
                                /[A-Z]/.test(values.password)
                                  ? "text-green-400"
                                  : "text-zinc-500"
                              }
                            >
                              Uppercase letter
                            </li>
                            <li
                              className={
                                /[a-z]/.test(values.password)
                                  ? "text-green-400"
                                  : "text-zinc-500"
                              }
                            >
                              Lowercase letter
                            </li>
                            <li
                              className={
                                /\d/.test(values.password)
                                  ? "text-green-400"
                                  : "text-zinc-500"
                              }
                            >
                              Number
                            </li>
                            <li
                              className={
                                /[@$!%*?&]/.test(values.password)
                                  ? "text-green-400"
                                  : "text-zinc-500"
                              }
                            >
                              Special character (@$!%*?&)
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <Label htmlFor="confirmPassword" className="mb-1">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                        <Field
                          as={Input}
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm password"
                          className={`pl-10 pr-10 ${
                            errors.confirmPassword && touched.confirmPassword
                              ? "border-destructive"
                              : ""
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <ErrorMessage
                        name="confirmPassword"
                        component="div"
                        className="text-sm text-destructive mt-1"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-b from-purple-600 to-purple-400 via-purple-500 hover:from-purple-700 hover:to-purple-500"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Resetting..." : "Reset Password"}
                    </Button>
                  </Form>
                )}
              </Formik>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]"><div className="text-white">Loading...</div></div>}>
      <ResetPasswordFormContent />
    </Suspense>
  );
}
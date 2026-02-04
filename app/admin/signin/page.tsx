'use client';

import React, { useState, Suspense } from 'react';
import { useToast } from '@/components/hooks/useToast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GoogleSignInButton from '@/components/auth/google';
import * as authActions from '@/app/actions/auth';
import { useAuth } from '@/context/AuthContext';
import { checkAdminStatus } from '@/app/actions/admin';

type AdminSignInFormValues = {
  email: string;
  password: string;
};

const adminSigninSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const adminSigninInitialValues: AdminSignInFormValues = {
  email: '',
  password: '',
};

function AdminSignInContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const { setUser } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const handleAdminSignIn = async (
    values: AdminSignInFormValues,
    { setSubmitting }: any
  ) => {
    try {
      const { email, password } = values;

      // First, sign in with auth
      const { success, error, user } = await authActions.signinAction(email, password);

      if (!success || !user) {
        toast.error(error || 'Invalid email or password');
        setSubmitting(false);
        return;
      }

      // Set user in context
      setUser(user);
      toast.success('Signing in...');

      // Wait for toast to be displayed and then check admin status
      setIsCheckingAdmin(true);
      await new Promise(resolve => setTimeout(resolve, 1500));

      const adminStatus = await checkAdminStatus();

      if (adminStatus.isAdmin) {
        // Already admin, go directly to dashboard
        router.push('/admin/support');
      } else {
        // Not admin yet, go to setup page to grant access
        router.push('/admin/setup');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || 'Sign-in failed unexpectedly');
      } else {
        toast.error('Sign-in failed unexpectedly');
      }
      setIsCheckingAdmin(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 min-h-screen bg-[#1a1a1a] text-white">
      {/* Left Side */}
      <div className="relative md:flex items-center justify-center p-10 hidden">
        <div className="absolute inset-0 bg-[url('/images/auth.webp')] bg-cover bg-center rounded-tr-3xl rounded-br-3xl" />
        <div className="relative z-10 max-w-md p-10 rounded-2xl border border-amber-500 backdrop-blur-md bg-black/30">
          <div className="flex items-center gap-2 mb-8">
            <Shield className="w-8 h-8 text-amber-500" />
            <img src="/luxela.svg" alt="Luxela Logo" className="w-24" />
          </div>
          <h2 className="text-3xl font-semibold mb-4">
            Admin <span className="text-amber-500">Dashboard</span>
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Access the Luxela admin support dashboard to manage your store, track orders, and support your customers.
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-8 h-8 text-amber-500" />
            <img src="/luxela.svg" alt="Luxela Logo" className="w-24" />
          </div>
          <h2 className="text-2xl font-semibold">Admin Access</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Sign in to access the admin dashboard and support tools
          </p>

          <Formik
            initialValues={adminSigninInitialValues}
            validationSchema={adminSigninSchema}
            onSubmit={handleAdminSignIn}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form className="space-y-3 sm:space-y-4">
                {/* Email */}
                <div>
                  <Label htmlFor="email" className="mb-1">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Field
                      as={Input}
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      className={`pl-10 ${errors.email && touched.email ? 'border-destructive' : ''}`}
                    />
                  </div>
                  <ErrorMessage name="email" component="div" className="text-sm text-destructive mt-1" />
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password" className="mb-1">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Field
                      as={Input}
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className={`pl-10 pr-10 ${errors.password && touched.password ? 'border-destructive' : ''}`}
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
                    <input type="checkbox" id="rememberMe" className="mr-2 accent-amber-600" />
                    <Label htmlFor="rememberMe">Remember me</Label>
                  </div>
                  <Link href="/forgot-password" className="text-amber-400 hover:underline">
                    Forgot password?
                  </Link>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-b from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600"
                  disabled={isSubmitting || isCheckingAdmin}
                >
                  {isSubmitting || isCheckingAdmin ? 'Processing...' : 'Sign In to Admin'}
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

          <GoogleSignInButton redirectPath="/admin/setup" />

          {/* Back to regular signin */}
          <p className="text-center text-zinc-500 text-sm mt-4">
            Not an admin?{' '}
            <Link href="/signin" className="text-amber-400 underline cursor-pointer">
              Sign In as Buyer/Seller <ArrowRight className="h-4 w-4 inline-block" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminSignInPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]"><div className="text-white">Loading...</div></div>}>
      <AdminSignInContent />
    </Suspense>
  );
}
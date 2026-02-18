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
import { signinAction } from '@/app/actions/auth';
import { useAuth } from '@/context/AuthContext';
import { checkAdminStatus } from '@/app/actions/admin';
import { createClient } from '@/utils/supabase/client';

type AdminSignInFormValues = {
  email: string;
  adminPassword: string;
};

const adminSigninSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  adminPassword: Yup.string().required('Admin password is required'),
});

const adminSigninInitialValues: AdminSignInFormValues = {
  email: '',
  adminPassword: '',
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
      const { email, adminPassword } = values;

      setIsCheckingAdmin(true);
      const signInResult = await signinAction(email, adminPassword);
      
      if (!signInResult.success) {
        toast.error(signInResult.error || 'Invalid email or password');
        setIsCheckingAdmin(false);
        setSubmitting(false);
        return;
      }

      if (!signInResult.user) {
        toast.error('User not found');
        setIsCheckingAdmin(false);
        setSubmitting(false);
        return;
      }

      setUser(signInResult.user);

      const supabase = createClient();
      const statusResult = await checkAdminStatus();
      
      if (statusResult.isAdmin) {
        toast.success('Welcome back, Admin!');
        await new Promise(resolve => setTimeout(resolve, 500));
        router.push('/admin/support');
      } else {
        toast.success('Credentials verified! Setting up admin access...');
        await new Promise(resolve => setTimeout(resolve, 500));
        router.push('/admin/setup');
      }
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || 'Sign in failed');
      } else {
        toast.error('Sign in failed');
      }
      setIsCheckingAdmin(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 min-h-screen bg-[#1a1a1a] text-white">
      {/* Left side - Branding */}
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

      {/* Right side - Form */}
      <div className="flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-8 h-8 text-amber-500" />
            <img src="/luxela.svg" alt="Luxela Logo" className="w-24" />
          </div>
          <h2 className="text-2xl font-semibold border-b-2 border-[#E5E7EB] pb-3 inline-block">Admin Access</h2>
          <p className="text-sm text-[#6B7280] mb-6 mt-3">
            Sign in to access the admin dashboard and support tools
          </p>

          <Formik
            initialValues={adminSigninInitialValues}
            validationSchema={adminSigninSchema}
            onSubmit={handleAdminSignIn}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form className="space-y-3 sm:space-y-4">
                {/* Email Field */}
                <div>
                  <Label htmlFor="email" className="mb-1">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Field
                      as={Input}
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      autoComplete="email"
                      className={`pl-10 ${errors.email && touched.email ? 'border-destructive' : ''}`}
                    />
                  </div>
                  <ErrorMessage name="email" component="div" className="text-sm text-destructive mt-1" />
                </div>

                {/* Password Field */}
                <div>
                  <Label htmlFor="adminPassword" className="mb-1">
                    Admin Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Field
                      as={Input}
                      id="adminPassword"
                      name="adminPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter admin password"
                      autoComplete="current-password"
                      className={`pl-10 pr-10 ${errors.adminPassword && touched.adminPassword ? 'border-destructive' : ''}`}
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
                  <ErrorMessage name="adminPassword" component="div" className="text-sm text-destructive mt-1" />
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <input type="checkbox" id="rememberMe" name="rememberMe" className="mr-2 accent-amber-600" />
                  <label htmlFor="rememberMe" className="text-sm font-medium cursor-pointer">Remember me</label>
                </div>

                {/* Sign In Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-b from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Sign In to Admin'}
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

          {/* Fallback Link */}
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
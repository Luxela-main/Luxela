'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, ArrowRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/hooks/useToast';

function AdminGoogleSignUpButton() {
  const toast = useToast();
  const supabase = createClient();

  const handleAdminGoogleSignUp = async () => {
    try {
      // Include admin=true parameter to signal admin signup to the callback
      const redirectUrl = `${window.location.origin}/api/auth/callback?admin=true`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('[AdminGoogleSignUp] OAuth error:', error);
        throw error;
      }

      if (data?.url) {
        console.log('[AdminGoogleSignUp] Redirecting to Google OAuth URL');
        window.location.href = data.url;
      } else {
        throw new Error('No OAuth URL returned from Supabase');
      }
    } catch (err: any) {
      console.error('[AdminGoogleSignUp] Error:', err);
      const errorMessage = err?.message || 'Failed to sign up with Google';
      toast.error(errorMessage);
    }
  };

  return (
    <button
      onClick={handleAdminGoogleSignUp}
      className="w-full flex items-center justify-center gap-3 bg-gradient-to-b from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 py-2 rounded text-sm text-white font-semibold transition-colors cursor-pointer"
    >
      <Image src="/google.svg" alt="Google" width={16} height={16} />
      Sign up with Google for Admin
    </button>
  );
}

function AdminSignInContent() {
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

      {/* Right side - OAuth Only */}
      <div className="flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-8 h-8 text-amber-500" />
            <img src="/luxela.svg" alt="Luxela Logo" className="w-24" />
          </div>
          
          <h2 className="text-2xl font-semibold border-b-2 border-[#E5E7EB] pb-3 inline-block">
            Admin Setup
          </h2>
          
          <p className="text-sm text-[#6B7280] mb-8 mt-3">
            Sign up with Google to become an admin. You'll then need to verify with the admin password to complete setup.
          </p>

          <div className="space-y-4">
            {/* Google OAuth Button */}
            <AdminGoogleSignUpButton />

            {/* Divider */}
            <div className="flex items-center">
              <div className="flex-grow border-t border-zinc-700" />
              <span className="px-2 text-zinc-500 text-sm">or</span>
              <div className="flex-grow border-t border-zinc-700" />
            </div>

            {/* Link to regular signin */}
            <p className="text-center text-zinc-500 text-sm">
              Want to signin as buyer or seller?{' '}
              <Link href="/signin" className="text-amber-400 underline cursor-pointer hover:text-amber-300">
                Sign In Here <ArrowRight className="h-4 w-4 inline-block" />
              </Link>
            </p>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg">
              <h3 className="text-sm font-semibold text-amber-400 mb-2">How admin setup works:</h3>
              <ol className="text-xs text-amber-300 space-y-1">
                <li>1. Sign up with your Google account</li>
                <li>2. You'll be taken to the admin setup page</li>
                <li>3. Enter the admin password to complete setup</li>
                <li>4. Access the admin dashboard</li>
              </ol>
            </div>
          </div>
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
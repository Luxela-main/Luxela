'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { setAdminRole, checkAdminStatus } from '@/app/actions/admin';
import { AlertCircle, CheckCircle, Loader, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/hooks/useToast';

export default function AdminSetupPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const toast = useToast();

  // Check if user is authenticated and not already admin
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          console.error('[AdminSetup] Not authenticated');
          router.push('/admin/signin');
          return;
        }

        setUserEmail(user.email || '');

        // Check if already admin
        const result = await checkAdminStatus();
        if (result.success && result.isAdmin) {
          setIsAdmin(true);
          // Redirect after showing message
          setTimeout(() => {
            router.push('/admin');
          }, 2000);
          return;
        }

        setIsLoading(false);
      } catch (err) {
        console.error('[AdminSetup] Error checking auth:', err);
        router.push('/admin/signin');
      }
    };

    checkAuth();
  }, [router]);

  const handleSetupAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      if (!adminPassword) {
        setError('Admin password is required');
        setIsSubmitting(false);
        return;
      }

      const result = await setAdminRole(userEmail, adminPassword);

      if (result.success) {
        setSuccess(true);
        toast.success('Admin setup complete! Redirecting to dashboard...');
        console.log('[AdminSetup] ✅ Admin role granted successfully');

        // Wait for session refresh and redirect
        setTimeout(async () => {
          try {
            const supabase = createClient();
            
            // Refresh session to get updated JWT with admin metadata
            console.log('[AdminSetup] Refreshing session...');
            const { error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError) {
              console.warn('[AdminSetup] Session refresh warning:', refreshError.message);
            } else {
              console.log('[AdminSetup] ✅ Session refreshed');
            }

            // Navigate to admin dashboard
            window.location.href = '/admin';
          } catch (err) {
            console.error('[AdminSetup] Error during setup completion:', err);
            window.location.href = '/admin';
          }
        }, 1000);
      } else {
        const errorMsg = result.error || 'Failed to setup admin';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'An unexpected error occurred';
      setError(errorMsg);
      toast.error(errorMsg);
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-white text-lg">Checking authentication...</p>
          <p className="text-gray-400 text-sm mt-2">Syncing with server...</p>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-white text-lg mb-2">You are already an admin!</p>
          <p className="text-gray-400 mb-6">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-xl border-2 border-[#E5E7EB] p-4 sm:p-8">
          <div className="text-center mb-6 sm:mb-8 pb-4 border-b-2 border-[#6B7280]">
            <img
              src="/luxela.svg"
              alt="Luxela"
              className="w-24 sm:w-32 mx-auto mb-3 sm:mb-4"
            />
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Admin Setup</h1>
            <p className="text-xs sm:text-sm text-[#D1D5DB]">
              Complete your admin account setup by verifying the admin password
            </p>
          </div>

          <form onSubmit={handleSetupAdmin} className="space-y-4 sm:space-y-6">
            {/* Email Display */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                Your Email
              </label>
              <input
                type="email"
                value={userEmail}
                disabled
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Logged in with this email
              </p>
            </div>

            {/* Admin Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  disabled={success}
                  className="w-full px-4 py-2 pr-10 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-gray-500 focus:border-amber-500 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                The admin password from your environment configuration
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start space-x-3 p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Error</p>
                  <p className="text-xs text-red-300 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-start space-x-3 p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-400">Success!</p>
                  <p className="text-xs text-green-300 mt-1">
                    Admin setup complete. Refreshing session...
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || success}
              className="w-full bg-gradient-to-b from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-semibold py-2 rounded-lg transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Verifying...' : 'Complete Admin Setup'}
            </Button>

            <p className="text-xs text-center text-gray-500">
              This will grant you administrator access to the dashboard
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
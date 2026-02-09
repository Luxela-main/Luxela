"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setAdminRole, checkAdminStatus } from "@/app/actions/admin";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";

export default function AdminSetupPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkStatus = async () => {
      const result = await checkAdminStatus();
      if (result.success) {
        setIsAdmin(result.isAdmin);
        setUserEmail(result.userEmail || "");
        if (result.isAdmin) {
          setTimeout(() => {
            router.push("/admin/support");
          }, 1000);
        }
      } else {
        if (result.error === "Not authenticated") {
          setTimeout(() => {
            router.push("/signin");
          }, 500);
        } else {
          setError(result.error || "Failed to check admin status");
        }
      }
      setIsLoading(false);
    };

    checkStatus();
  }, [router]);

  const handleSetAdmin = async () => {
    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    const result = await setAdminRole(userEmail, adminPassword);

    if (result.success) {
      setSuccess(true);
      
      // Force client-side session refresh to get the updated JWT token with admin flag
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        
        // Refresh the session to load the new JWT token from the server
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.warn('Session refresh warning:', refreshError.message);
          // Continue anyway - the metadata was updated server-side
        }
        
        // Wait for session to be fully updated
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (refreshErr) {
        console.warn('Failed to refresh client session:', refreshErr);
      }
      
      // Now redirect to dashboard
      setTimeout(() => {
        router.push('/admin/support');
      }, 1000);
    } else {
      setError(result.error || "Failed to set admin role");
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-white text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (error === "Not authenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <p className="text-white text-lg mb-2">Not Authenticated</p>
          <p className="text-gray-400 mb-6">Please log in first to access admin setup</p>
          <Button
            onClick={() => router.push("/signin")}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors cursor-pointer"
          >
            Go to Login
          </Button>
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
              Grant yourself admin access to the support dashboard
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
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
                This is the email associated with your account
              </p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1 text-[0.65rem] sm:text-xs">
                Required only if there are existing admins in the system
              </p>
            </div>

            {error && (
              <div className="flex items-start space-x-3 p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Error</p>
                  <p className="text-xs text-red-300 mt-1">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="flex items-start space-x-3 p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-400">Success!</p>
                  <p className="text-xs text-green-300 mt-1">
                    Admin role granted. Refreshing session...
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={handleSetAdmin}
              disabled={isSubmitting || success}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition-colors cursor-pointer"
            >
              {isSubmitting ? "Setting up..." : "Grant Admin Access"}
            </Button>

            <p className="text-xs text-center text-gray-500">
              This will grant you administrator access to the support dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
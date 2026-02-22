'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader } from '@/components/loader/loader';
import { useAuth } from '@/context/AuthContext';

function AuthCallbackCompleteHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  const checkProfile = async (role: 'buyer' | 'seller') => {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(`/api/profile/check`, {
          credentials: 'include',
        });
        
        if (!res.ok) {
          lastError = `HTTP ${res.status}`;
          
          if (res.status === 503 || res.status === 504 || res.status === 500) {
            console.warn(`[AuthCallbackComplete] Profile check attempt ${attempt}/${maxRetries} failed (${res.status}), retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          
          console.error('[AuthCallbackComplete] Profile check failed with status:', res.status);
          return { exists: false, profileComplete: false };
        }
        
        const data = await res.json();
        console.log('[AuthCallbackComplete] Profile check:', data);
        return {
          exists: data?.exists === true,
          profileComplete: data?.profileComplete === true,
        };
      } catch (err) {
        lastError = err;
        console.warn(`[AuthCallbackComplete] Profile check attempt ${attempt}/${maxRetries} error:`, err);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
      }
    }
    
    console.error('[AuthCallbackComplete] Profile check failed after retries:', lastError);
    router.push('/signin?error=profile_check_failed');
    return { exists: false, profileComplete: false };
  };

  const handleRedirect = async (currentUser: any) => {
    const role = currentUser?.user_metadata?.role as 'buyer' | 'seller' | 'admin' | undefined;
    const customRedirect = searchParams.get('redirect');

    console.log('[AuthCallbackComplete] Redirecting user with role:', role);

    if (customRedirect) {
      window.location.href = customRedirect;
      return;
    }

    if (!role) {
      router.push('/select-role');
      return;
    }

    if (role === 'admin') {
      router.push('/admin/setup');
      return;
    }

    const profileData = await checkProfile(role);

    if (role === 'buyer') {
      if (!profileData.exists || !profileData.profileComplete) {
        router.push('/buyer/profile/create');
        return;
      }
      router.push('/buyer/dashboard');
      return;
    }

    if (role === 'seller') {
      if (!profileData.exists || !profileData.profileComplete) {
        router.push('/sellersAccountSetup');
        return;
      }
      router.push('/sellers/dashboard');
      return;
    }

    router.push('/select-role');
  };

  useEffect(() => {
    // Set timeout to prevent infinite loading
    // 25 seconds allows sufficient time for OAuth processing and extended session retries
    const timeout = setTimeout(() => {
      if (loading) {
        console.error('[AuthCallbackComplete] Auth loading timeout after 25 seconds');
        router.push('/signin?error=auth_timeout');
      }
    }, 25000);

    return () => clearTimeout(timeout);
  }, [loading, router]);

  useEffect(() => {
    // Wait for auth context to finish loading session from server
    if (loading) {
      console.log('[AuthCallbackComplete] Waiting for auth to load...');
      return;
    }

    if (!user) {
      console.error('[AuthCallbackComplete] No user found after auth load');
      router.push('/signin?error=auth_failed');
      return;
    }

    console.log('[AuthCallbackComplete] User authenticated:', user.id, '- starting redirect...');
    handleRedirect(user);
  }, [loading, user, router, searchParams]);


  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <Loader />
    </div>
  );
}

export default function AuthCallbackCompletePage() {
  return (
    <Suspense fallback={<Loader />}>
      <AuthCallbackCompleteHandler />
    </Suspense>
  );
}
'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader } from '@/components/loader/loader';

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect to server-side OAuth handler
  useEffect(() => {
    const run = async () => {
      try {
        // Get current URL params
        const code = searchParams.get('code');
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        const redirect = searchParams.get('redirect');

        console.log('[AuthCallback] Delegating to server-side handler - code:', !!code, 'tokenHash:', !!tokenHash);

        // Redirect to server-side OAuth handler which will properly set cookies
        const params = new URLSearchParams();
        if (code) params.append('code', code);
        if (tokenHash) params.append('token_hash', tokenHash);
        if (type) params.append('type', type);
        if (redirect) params.append('redirect', redirect);

        // Redirect to the server-side handler
        window.location.href = `/api/auth/callback?${params.toString()}`;
      } catch (err) {
        console.error('[AuthCallback] Error:', err);
        router.replace('/signin?error=unexpected');
      }
    };

    run();
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <Loader />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Loader />}>
      <AuthCallbackHandler />
    </Suspense>
  );
}
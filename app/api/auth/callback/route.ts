import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Server-side OAuth callback handler
 * This endpoint handles the OAuth code exchange server-side to properly set auth cookies
 * Then redirects to the client-side callback page to handle routing logic
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const redirect = searchParams.get('redirect');

  console.log('[OAuth Callback API] Received - code:', !!code, 'tokenHash:', !!tokenHash, 'type:', type);

  if (!code && !tokenHash) {
    console.error('[OAuth Callback API] No code or tokenHash provided');
    return NextResponse.redirect(
      new URL('/signin?error=missing_code', request.url)
    );
  }

  try {
    const supabase = await createClient();

    // Handle OAuth code exchange
    if (code) {
      console.log('[OAuth Callback API] Exchanging code for session server-side');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('[OAuth Callback API] Code exchange error:', error.message);
        return NextResponse.redirect(
          new URL(`/signin?error=${encodeURIComponent(error.message)}`, request.url)
        );
      }

      if (!data.session) {
        console.error('[OAuth Callback API] No session after code exchange');
        return NextResponse.redirect(
          new URL('/signin?error=no_session', request.url)
        );
      }

      console.log('[OAuth Callback API] Code exchange successful, user:', data.session.user.id);

      // Check if there's a custom redirect path in the query params
      const customRedirect = searchParams.get('redirect');
      const redirectTarget = customRedirect ? `/auth/callback?redirect=${encodeURIComponent(customRedirect)}` : '/auth/callback';

      // Redirect to the client-side callback handler which will complete the auth flow
      const response = NextResponse.redirect(
        new URL(redirectTarget, request.url)
      );

      // Disable caching to ensure fresh session is retrieved
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      // Ensure SameSite policy allows cookies to be set in redirect response
      response.headers.set('Set-Cookie', `auth-established=true; Path=/; SameSite=Lax; Secure; HttpOnly`);

      return response;
    }

    // Handle email link verification
    if (tokenHash && type === 'signup') {
      console.log('[OAuth Callback API] Verifying signup OTP server-side');
      const { data, error } = await supabase.auth.verifyOtp({
        type: 'signup',
        token_hash: tokenHash,
      });

      if (error) {
        console.error('[OAuth Callback API] OTP verification error:', error.message);
        return NextResponse.redirect(
          new URL(`/signin?error=${encodeURIComponent(error.message)}`, request.url)
        );
      }

      if (!data.session) {
        console.error('[OAuth Callback API] No session after OTP verification');
        return NextResponse.redirect(
          new URL('/signin?error=no_session_after_otp', request.url)
        );
      }

      console.log('[OAuth Callback API] OTP verification successful');
      const response = NextResponse.redirect(
        new URL('/auth/callback', request.url)
      );

      // Disable caching to ensure fresh session is retrieved
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      // Ensure SameSite policy allows cookies to be set in redirect response
      response.headers.set('Set-Cookie', `auth-established=true; Path=/; SameSite=Lax; Secure; HttpOnly`);

      return response;
    }

    console.error('[OAuth Callback API] No valid callback type detected');
    return NextResponse.redirect(
      new URL('/signin?error=invalid_callback_type', request.url)
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[OAuth Callback API] Error:', errorMessage);
    return NextResponse.redirect(
      new URL(`/signin?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}
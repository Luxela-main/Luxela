import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  console.log('[OAuth Callback API] Received - code:', !!code, 'tokenHash:', !!tokenHash, 'type:', type, 'error:', error);

  if (error) {
    const message = errorDescription || error;
    console.error('[OAuth Callback API] OAuth provider error:', message);
    return NextResponse.redirect(
      new URL(`/signin?error=${encodeURIComponent(message)}`, request.url)
    );
  }

  if (!code && !tokenHash) {
    console.error('[OAuth Callback API] No code or tokenHash provided');
    return NextResponse.redirect(
      new URL('/signin?error=invalid_callback_missing_credentials', request.url)
    );
  }

  try {
    const supabase = await createClient();

    if (code) {
      console.log('[OAuth Callback API] Exchanging code for session server-side');
      
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          const errorMessage = error.message || 'Code exchange failed';
          console.error('[OAuth Callback API] Code exchange error:', errorMessage);
          
          const isPKCEError = errorMessage.includes('code_verifier') || 
                            errorMessage.includes('PKCE');
          
          if (isPKCEError) {
            console.warn('[OAuth Callback API] PKCE verifier issue detected - likely mobile storage cleared during OAuth flow');
            return NextResponse.redirect(
              new URL(
                `/signin?error=${encodeURIComponent('Session expired. Please clear your browser cache and try signing in again.')}`,
                request.url
              )
            );
          }
          
          return NextResponse.redirect(
            new URL(`/signin?error=${encodeURIComponent(errorMessage)}`, request.url)
          );
        }

        if (!data.session) {
          console.error('[OAuth Callback API] No session after code exchange');
          return NextResponse.redirect(
            new URL('/signin?error=no_session_created', request.url)
          );
        }

        console.log('[OAuth Callback API] Code exchange successful, user:', data.session.user.id);

        const customRedirect = searchParams.get('redirect');
        const redirectTarget = customRedirect 
          ? `/auth/callback?redirect=${encodeURIComponent(customRedirect)}` 
          : '/auth/callback';

        const response = NextResponse.redirect(
          new URL(redirectTarget, request.url)
        );

        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');

        return response;
      } catch (exchangeError) {
        const message = exchangeError instanceof Error 
          ? exchangeError.message 
          : 'Unknown error during code exchange';
        console.error('[OAuth Callback API] Unexpected error during exchange:', message);
        
        return NextResponse.redirect(
          new URL(`/signin?error=${encodeURIComponent(message)}`, request.url)
        );
      }
    }

    if (tokenHash && type === 'signup') {
      console.log('[OAuth Callback API] Verifying signup OTP server-side');
      
      try {
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

        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');

        return response;
      } catch (verifyError) {
        const message = verifyError instanceof Error 
          ? verifyError.message 
          : 'Unknown error during OTP verification';
        console.error('[OAuth Callback API] Unexpected error during verification:', message);
        
        return NextResponse.redirect(
          new URL(`/signin?error=${encodeURIComponent(message)}`, request.url)
        );
      }
    }

    console.error('[OAuth Callback API] No valid callback type detected');
    return NextResponse.redirect(
      new URL('/signin?error=invalid_callback_type', request.url)
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[OAuth Callback API] Unexpected error:', errorMessage);
    return NextResponse.redirect(
      new URL(`/signin?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isNewPasswordPage = (request.nextUrl.pathname === '/signup');

  if (
    user &&
    request.nextUrl.pathname.startsWith('/signup') &&
    !isNewPasswordPage
  ) {
    return NextResponse.redirect(new URL('/', request.url));
  }

    const publicRoutes = ['/', '/signup', '/signin', '/privacy-policy', 'verify-email'];


  // protected routes
  if (!user && !publicRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/signup', request.url));
  }

  return supabaseResponse;
}
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

  const isNewPasswordPage = (request.nextUrl.pathname = '/new-password');

  if (
    user &&
    request.nextUrl.pathname.startsWith('/signin') &&
    !isNewPasswordPage
  ) {
    return NextResponse.redirect(new URL('/', request.url));
  }

const publicPaths = ['/', '/signin', '/signup', ];

const path = request.nextUrl.pathname;
const isPublic = publicPaths.some((p) => path.startsWith(p));

// If not logged in and route is NOT public → redirect
if (!user && !isPublic) {
  return NextResponse.redirect(new URL('/signin', request.url));
}  
        
  // // protected routes
  // if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
  //   return NextResponse.redirect(new URL('/signin', request.url));
  // }

  return supabaseResponse;
}


//   // List of public routes that anyone can access
//   const publicPaths = ['/', '/auth/login', '/auth/signup', '/about'];

//   // Protect all other routes
//   if (!user && !publicPaths.includes(request.nextUrl.pathname)) {
//     return NextResponse.redirect(new URL('/auth/login', request.url));
//   }

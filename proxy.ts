import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  
  // Create a server-side Supabase client that can read session from cookies
  let user: any = null;
  let role: string | null = null;
  let isAdmin = false;
  
  try {
    // Read cookies from the request
    const cookieHeader = request.headers.get('cookie');
    const cookies = new Map<string, string>();
    
    if (cookieHeader) {
      cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies.set(decodeURIComponent(name), decodeURIComponent(value));
        }
      });
    }
    
    // Create server-side Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return Array.from(cookies.entries()).map(([name, value]) => ({
              name,
              value,
            }));
          },
          setAll() {
            // No-op for request middleware
          },
        },
      }
    );
    
    // Get the current user - getUser() is more secure as it verifies with Supabase server
    const { data: { user: authUser }, error } = await supabase.auth.getUser();
    
    if (authUser) {
      user = authUser;
      role = authUser.user_metadata?.role;
      isAdmin = authUser.user_metadata?.admin === true || role === 'admin';
    }
  } catch (error) {
    console.error('[PROXY] Error reading session:', error);
  }

  const pathname = request.nextUrl.pathname;

  // Public pages that do NOT require authentication
  const publicRoutes = [
    "/",
    "/signup",
    "/buyer",
    "/buyer/collections",
    "/buyer/browse",
    "/buyer/brands",
    "/signin",
    "/privacy-policy",
    "/verify-email",
    "/select-role",
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAlwaysAllowed = [
    "/privacy-policy",
    "/verify-email",
    "/select-role",
  ].includes(pathname);

  // Admin routes that require admin role
  const adminRoutes = ["/admin/support", "/admin"];
  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Public admin pages (signin, setup)
  const publicAdminRoutes = ["/admin/signin", "/admin/setup"];
  const isPublicAdminRoute = publicAdminRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If logged in but role not set → force select role
  if (user && !role && !isAlwaysAllowed && !isPublicRoute) {
    return NextResponse.redirect(
      new URL("/select-role", request.url)
    );
  }

  // Prevent logged users from visiting auth pages
  if (
    user &&
    role &&
    ["/", "/signup", "/signin"].includes(pathname) &&
    !isAlwaysAllowed
  ) {
    return NextResponse.redirect(
      new URL(
        role === "seller"
          ? "/sellers/dashboard"
          : "/buyer/profile",
        request.url
      )
    );
  }

  // Protect buyer/seller routes
  if (user && role && !isAlwaysAllowed) {
    const isBuyerRoute = pathname.startsWith("/buyer");
    const isSellerRoute = pathname.startsWith("/sellers");

    if (role === "seller" && isBuyerRoute) {
      return NextResponse.redirect(
        new URL("/sellers/dashboard", request.url)
      );
    }

    if (role === "buyer" && isSellerRoute) {
      return NextResponse.redirect(
        new URL("/buyer/profile", request.url)
      );
    }
  }

  if (isAdminRoute && !isPublicAdminRoute) {
    if (!user) {
      console.log(`[PROXY] No user token for admin route: ${pathname}`);
      return NextResponse.redirect(new URL("/admin/signin", request.url));
    }
    // Redirect /admin/support to /admin (main dashboard)
    if (pathname === '/admin/support') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    console.log(
      `[PROXY] User authenticated for admin route: user=${user?.email}, role=${role}, isAdmin=${isAdmin}, pathname=${pathname}`
    );
  }

  // Not logged in? Block all private routes
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return response;
}
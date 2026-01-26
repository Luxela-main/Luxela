import { NextResponse, type NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";

// Decode JWT token from cookie without making API call (instant, no network delay)
function getUserFromToken(token: string | undefined) {
  if (!token) return null;
  
  try {
    const decoded = jwtDecode(token) as any;
    return {
      id: decoded.sub,
      email: decoded.email,
      user_metadata: decoded.user_metadata || {},
      app_metadata: decoded.app_metadata || {},
    };
  } catch (error) {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Get JWT token from cookies - Supabase stores it with dynamic name or as 'access_token'
  const authToken =
    request.cookies.get("sb-auth-token")?.value ||
    request.cookies.get("access_token")?.value ||
    // Try to find Supabase session token with dynamic project reference
    Array.from(request.cookies.getAll())
      .find((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"))?.value;

  // Decode user from JWT without making API call (instant, no Supabase API delay)
  const user = getUserFromToken(authToken);

  const pathname = request.nextUrl.pathname;

  // Public pages that do NOT require authentication
  const publicRoutes = [
    "/",
    "/signup",
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

  const role =
    user?.user_metadata?.role || user?.app_metadata?.role;

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

  // Not logged in? Block all private routes
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return response;
}
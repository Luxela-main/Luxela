import { NextResponse, type NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";

function getUserFromToken(token: string | undefined) {
  if (!token) return null;
  
  try {
    const decoded = jwtDecode(token) as any;
    
    const userMetadata = decoded.user_metadata || decoded.metadata || {};
    const appMetadata = decoded.app_metadata || {};
    
    // Check for admin flag in multiple places for compatibility
    const isAdmin = 
      userMetadata.admin === true || 
      appMetadata.admin === true || 
      decoded.admin === true;
    
    return {
      id: decoded.sub,
      email: decoded.email,
      user_metadata: {
        ...userMetadata,
        admin: isAdmin, 
      },
      app_metadata: appMetadata,
    };
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const authToken =
    request.cookies.get("sb-auth-token")?.value ||
    request.cookies.get("access_token")?.value ||
    Array.from(request.cookies.getAll())
      .find((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"))?.value;

  const user = getUserFromToken(authToken);

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

  const role =
    user?.user_metadata?.role || user?.app_metadata?.role;

  const isAdmin = user?.user_metadata?.admin === true;

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

  // Protect admin routes - only admins can access
  if (isAdminRoute && !isPublicAdminRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/admin/signin", request.url));
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/admin/signin", request.url));
    }
  }

  // Not logged in? Block all private routes
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return response;
}
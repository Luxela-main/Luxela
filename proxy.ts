import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
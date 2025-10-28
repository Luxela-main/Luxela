import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const publicRoutes = [
    "/",
    "/signup",
    "/signin",
    "/privacy-policy",
    "/verify-email",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAlwaysAllowed = ["/privacy-policy", "/verify-email"].includes(
    pathname
  );

  const role = user?.user_metadata?.role || user?.app_metadata?.role;

  // Redirect logged-in users from homepage, signup, or signin to their dashboard
  if (
    user &&
    !isAlwaysAllowed &&
    ["/", "/signup", "/signin"].includes(pathname)
  ) {
    const dashboardUrl =
      role === "seller" ? "/seller/dashboard" : "/buyer/profile";
    return NextResponse.redirect(new URL(dashboardUrl, request.url));
  }

  // Role-based route protection
  if (user && !isAlwaysAllowed) {
    const isBuyerRoute = pathname.startsWith("/buyer");
    const isSellerRoute = pathname.startsWith("/seller");

    if (role === "seller" && isBuyerRoute) {
      return NextResponse.redirect(new URL("/seller/dashboard", request.url));
    }

    if (role === "buyer" && isSellerRoute) {
      return NextResponse.redirect(new URL("/buyer/profile", request.url));
    }

    if (!role && (isBuyerRoute || isSellerRoute)) {
      return NextResponse.redirect(new URL("/buyer/profile", request.url));
    }
  }

  // Redirect unauthenticated users trying to access protected routes
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return response;
}

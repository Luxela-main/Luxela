import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    "/select-role",
  ];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isAlwaysAllowed = ["/privacy-policy", "/verify-email", "/select-role"].includes(pathname);

  const role = user?.user_metadata?.role || user?.app_metadata?.role;

  if (user && !role && !isAlwaysAllowed && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/select-role", request.url));
  }

  if (user && role && !isAlwaysAllowed && ["/", "/signup", "/signin"].includes(pathname)) {
    const dashboardUrl = role === "seller" ? "/sellers/dashboard" : "/buyer/profile";
    return NextResponse.redirect(new URL(dashboardUrl, request.url));
  }

  if (user && role && !isAlwaysAllowed) {
    const isBuyerRoute = pathname.startsWith("/buyer");
    const isSellerRoute = pathname.startsWith("/sellers");

    if (role === "seller" && isBuyerRoute) {
      return NextResponse.redirect(new URL("/sellers/dashboard", request.url));
    }

    if (role === "buyer" && isSellerRoute) {
      return NextResponse.redirect(new URL("/buyer/profile", request.url));
    }
  }

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return response;
}

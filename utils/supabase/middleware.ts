import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
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

  const pathname = request.nextUrl.pathname;

  // Public routes (accessible without login)
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

  // Redirect logged-in users from homepage, signup, or signin → dashboard 
  // TODO: (check user role and redirect)
  if (
    user &&
    !isAlwaysAllowed &&
    ["/", "/signup", "/signin"].includes(pathname)
  ) {
    return NextResponse.redirect(new URL("/buyer/profile", request.url));
  }

  // Redirect unauthenticated users trying to access protected routes
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return supabaseResponse;
}

import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {

  const token = req.cookies.get("sb-access-token");

  const protectedPaths = ["/dashboard", "/admin", "/seller", "/buyer"];

  const isProtected = protectedPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );
  
  if (isProtected && !token) {
    const signinUrl = new URL("/signin", req.url);
    signinUrl.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(signinUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/seller/:path*", "/buyer/:path*"],
};

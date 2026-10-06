import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // The access cookie expires with the token (~5 min); a refresh cookie still
  // counts as signed in because API calls renew the access token.
  const accessToken =
    request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ??
    request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (pathname.startsWith("/dashboard") && !accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login/change-password" && !accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((pathname === "/login" || pathname === "/login/") && accessToken) {
    const redirectTo = request.nextUrl.searchParams.get("redirect");
    const destination =
      redirectTo && redirectTo.startsWith("/dashboard")
        ? redirectTo
        : "/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/login/change-password"],
};

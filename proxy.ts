import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ACCESS_TOKEN_COOKIE, PASSWORD_CHANGE_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";

/** BFF calls an account with a temporary password may still make. */
const PASSWORD_CHANGE_ALLOWED = new Set([
  "POST /bff/auth/me/password",
  "GET /bff/auth/session",
  "POST /bff/auth/logout",
  "POST /bff/auth/login",
  "GET /bff/auth/me",
]);

/** Public reads that never use the session (site images, calculator, certificate check). */
const PUBLIC_BFF_READS = ["/bff/media/", "/bff/zakat/calculator-config", "/bff/certificates/verify/"];

/**
 * Cookieless endpoints a browser posts to on its own, where a forged request
 * has nothing to abuse: the CSP report sink.
 */
const COOKIELESS_POSTS = new Set(["/bff/csp-report"]);

/**
 * Writes the Origin check never blocks. Sign-out must always work: if a
 * misconfigured proxy made the check refuse it, the cookies would stay and
 * /login would send the user straight back to the dashboard. The worst a
 * forged sign-out can do is sign someone out.
 */
const ORIGIN_CHECK_EXEMPT = new Set([...COOKIELESS_POSTS, "/bff/auth/logout"]);

function bffError(status: number, message: string) {
  return NextResponse.json({ success: false, message }, { status, headers: { "Cache-Control": "no-store" } });
}

/** `host[:port]` as a URL with this scheme would print it, so default ports compare equal. */
function normalizedHost(host: string, protocol: string): string | null {
  try {
    return new URL(`${protocol}//${host.trim()}`).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Route handlers don't get the Origin check that Server Actions have, and
 * SameSite=Lax still lets a cross-site top-level POST through. So a write
 * whose Origin names another site is refused. A request with no Origin
 * (older browsers, server-to-server calls) is let through: every current
 * browser sends Origin on a cross-site POST, so a forged one carries it.
 */
function crossSiteWrite(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    logRefusal(request, origin); // "null" (sandboxed frames, some redirects) or garbage.
    return true;
  }
  const originHost = originUrl.host.toLowerCase();

  const candidates = [
    request.headers.get("host"),
    ...(request.headers.get("x-forwarded-host")?.split(",") ?? []),
  ];
  for (const candidate of candidates) {
    if (candidate && normalizedHost(candidate, originUrl.protocol) === originHost) return false;
  }

  // The public address, for a reverse proxy that rewrites Host and sets no X-Forwarded-Host.
  const siteUrl = process.env.SITE_URL;
  if (siteUrl) {
    try {
      if (new URL(siteUrl).origin === originUrl.origin) return false;
    } catch {
      // A malformed SITE_URL simply doesn't match.
    }
    logRefusal(request, origin);
    return true;
  }

  // nginx sends Host: 127.0.0.1:3000 by default (proxy_set_header Host is not
  // set) and no X-Forwarded-Host. Without SITE_URL the public origin is then
  // unknown, and refusing would block every save on the site. Let it through
  // (SameSite=Lax cookies still keep the session off cross-site POSTs) and say
  // once in the log how to turn the check on.
  if (isLoopbackHost(request.headers.get("host"))) {
    warnOriginUnverifiable();
    return false;
  }
  logRefusal(request, origin);
  return true;
}

// One line per origin per process start, so a misconfigured proxy shows up in
// the server log (not only as a 403 in the browser) without an attack flooding it.
const refusedOrigins = new Set<string>();
function logRefusal(request: NextRequest, origin: string) {
  if (refusedOrigins.has(origin) || refusedOrigins.size >= 50) return;
  refusedOrigins.add(origin);
  console.warn(
    `[proxy] refused a /bff write from Origin ${origin.slice(0, 100)} ` +
      `(Host ${request.headers.get("host") ?? "-"}, X-Forwarded-Host ${request.headers.get("x-forwarded-host") ?? "-"}, ` +
      `SITE_URL ${process.env.SITE_URL ?? "unset"}). If this is the site's own address, set SITE_URL to that exact ` +
      "origin (scheme, host and port) or have nginx send `proxy_set_header Host $http_host;`.",
  );
}

function isLoopbackHost(host: string | null): boolean {
  if (!host) return false;
  const name = host.trim().toLowerCase().replace(/:\d+$/, "");
  return name === "localhost" || name === "127.0.0.1" || name === "[::1]" || name.endsWith(".localhost");
}

let originWarningLogged = false;
function warnOriginUnverifiable() {
  if (originWarningLogged) return;
  originWarningLogged = true;
  console.warn(
    "[proxy] cannot check the Origin of /bff writes: the reverse proxy sends Host as a loopback address and no X-Forwarded-Host. Set SITE_URL to the exact public origin (scheme, host and port), or add `proxy_set_header Host $http_host;` in nginx ($host drops the port).",
  );
}

function allowedDuringPasswordChange(method: string, pathname: string): boolean {
  if (PASSWORD_CHANGE_ALLOWED.has(`${method} ${pathname}`)) return true;
  if (COOKIELESS_POSTS.has(pathname)) return true;
  return (method === "GET" || method === "HEAD") && PUBLIC_BFF_READS.some((prefix) => pathname.startsWith(prefix));
}

function guardBff(request: NextRequest): NextResponse | null {
  const method = request.method.toUpperCase();
  const pathname = request.nextUrl.pathname.replace(/\/+$/, "") || "/";

  if (method !== "GET" && method !== "HEAD" && !ORIGIN_CHECK_EXEMPT.has(pathname) && crossSiteWrite(request)) {
    return bffError(403, "This request came from another website and was blocked.");
  }

  // Same rule as the dashboard redirect below, for the API: a temporary
  // password only opens the change-password screen. The auth service should
  // enforce this too; this closes the BFF side.
  if (request.cookies.get(PASSWORD_CHANGE_COOKIE)?.value && !allowedDuringPasswordChange(method, pathname)) {
    return bffError(403, "Change your temporary password first.");
  }

  return null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/bff/")) {
    return guardBff(request) ?? NextResponse.next();
  }

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

  // An account with a temporary password can't use the dashboard until it sets its own.
  if (pathname.startsWith("/dashboard") && request.cookies.get(PASSWORD_CHANGE_COOKIE)?.value) {
    const changeUrl = new URL("/login/change-password", request.url);
    changeUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(changeUrl);
  }

  if (pathname === "/login/change-password" && !accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((pathname === "/login" || pathname === "/login/") && accessToken && !request.cookies.get(PASSWORD_CHANGE_COOKIE)?.value) {
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
  matcher: ["/dashboard/:path*", "/login", "/login/change-password", "/bff/:path*"],
};
